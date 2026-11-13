# 02 — Technical Architecture Proposal

> Phase 1 deliverable. Subject to approval before any code is written.

## 2.1 Architectural stance

A single Next.js 16 application hosts both the public site and the admin dashboard, with **Supabase PostgreSQL as the only source of truth** for content, orders, and customers.

```
                    ┌──────────────────────────────┐
   Visitor ────────▶│   Vercel (Next.js 16 App Router)│
                    │                                │
                    │  Route Handlers / Server Actions│
                    │  proxy.ts  (session refresh)   │
                    │  RSC by default, client islands │
                    └───────┬────────────────────────┘
                            │  @supabase/ssr (cookie sessions)
                            │  @supabase/supabase-js (PostgREST)
                            ▼
        ┌───────────────────────────────────────────┐
        │            Supabase (PostgreSQL)          │
        │  Auth · Postgres + RLS · Storage · Realtime│
        └───────────┬───────────────────────────────┘
                    │
                    ▼
              Resend (email)         ← optional, degrades gracefully
```

**Why one app rather than a separate admin:** the spec's stack (§2) lists only Next.js, Supabase, and Resend. Splitting into two apps would double the deployment surface, duplicate the type layer, and force a cross-service auth boundary that the spec never asks for. Route groups (`(public)` / `(auth)` / `admin`) give layout isolation without deployment isolation.

**Why not a separate API service:** spec §2 specifies "Next.js Server Actions / Route Handlers" *as* the backend. A separate Node/Express API would contradict the stack.

## 2.2 Rendering model

| Concern | Decision |
|---|---|
| Default | React Server Components. Pages fetch from Supabase directly in the component. |
| Client islands | Only where interactivity demands it: filter/search bars, mobile nav, forms, charts, modals, toasts. |
| Data mutations | Server Actions (`'use server'`), co-located in `src/lib/actions/<domain>.ts`, grouped by domain (portfolio, services, orders, products, inquiries, testimonials, settings, media). |
| Binary transport | Route Handlers under `src/app/api/**` — needed only for: file upload/download, signed URL minting, payment webhooks, health checks. |
| Caching | Public catalogue pages are `revalidateTag`-style cached with path revalidation on admin write. Admin pages are always dynamic (`no-store`) — never cache authenticated content. |
| Auth cookies | `@supabase/ssr` cookie adapter, refreshed in `src/proxy.ts` via `supabase.auth.getClaims()` per current Supabase guidance. |

### Request lifecycle

```
Request
  └─▶ src/proxy.ts
        ├─ createServerClient (cookie adapter)
        ├─ await supabase.auth.getClaims()   ← refreshes + verifies token
        ├─ write refreshed cookies onto the response
        └─ route match:
             /admin/**  → no session OR role ≠ ADMIN ⇒ redirect /admin-login
                          (role checked server-side; UI hiding is not the gate)
             /api/**    → pass through, CORS + rate-limit applied in handler
             else       → pass through
  └─▶ Page / Route Handler / Server Action
        ├─ createServerClient (per-request)
        ├─ guard: requireAdmin() / requireCustomer()  ← real authorization
        ├─ Supabase query (RLS applies as a second, independent layer)
        └─ render
```

## 2.3 Authorization model (defence in depth)

Three independent layers. Any one alone is insufficient; the spec (§7) demands server-side validation, RLS, and protected routes.

| Layer | Mechanism | Covers |
|---|---|---|
| 1. Route gate | `proxy.ts` → redirect unauthenticated/non-admin away from `/admin/**` | UX + trivial enumeration |
| 2. Server guard | `requireAdmin()` / `requireCustomer()` in `src/lib/supabase/guards.ts`, called in every layout, page, action, and route handler | **Actual authorization.** Never trusts client input. |
| 3. Row Level Security | Postgres policies on all 20 tables | Data isolation even if app code is wrong |

**Role model.** `profiles.role` ∈ `{ADMIN, CUSTOMER}`. A `SECURITY DEFINER` helper `public.is_admin()` reads the role of `auth.uid()`. RLS policies call `is_admin()` rather than querying `profiles` directly, which avoids infinite recursion (a policy on `profiles` that selects from `profiles`).

**Ownership rules (§7):** a customer may read only their own `service_orders`, `digital_orders`, and `downloads` rows. Ownership is enforced by `customer_id = auth.uid()` in the RLS policy, not by application filters.

**Service-role discipline.** The Supabase service-role key is used **only** in a server-only module (`src/lib/supabase/admin.ts`, marked `import 'server-only'`) and only for the two operations that genuinely require it: minting short-lived signed download URLs and privileged storage writes. It is never prefixed `NEXT_PUBLIC_` and never returned to the client.

## 2.4 Data access pattern

```ts
// src/lib/supabase/server.ts  — per-request server client
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function createClient() {
  const cookieStore = await cookies();          // Next 16: cookies() is async
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            /* Server Component: proxy.ts owns the write path */
          }
        },
      },
    },
  );
}
```

**Query placement.** Read queries live in `src/lib/queries/<domain>.ts` returning typed, narrow projections — never `select('*')` for public catalogue pages. The admin tables also avoid `select('*')` so that the service-role key and internal columns can never leak into a client payload by accident.

**Type generation.** `src/types/database.types.ts` is generated from the live Supabase project via `supabase gen types typescript --linked` and committed. It is regenerated, never hand-edited. Until credentials exist, a hand-written equivalent matching the migration DDL is used so the build is not blocked.

## 2.5 File upload & download security

Two distinct storage buckets with different trust levels — required by §5.I and §8.

| Bucket | Visibility | Contents | Access method |
|---|---|---|---|
| `public-media` | `public` | Portfolio images, product *previews*, avatars, logos | Direct public URL via `next/image` + `remotePatterns` |
| `private-products` | `private` | Actual purchasable digital product files | **Short-lived signed URL only**, minted server-side after a verified paid order |
| `private-attachments` | `private` | Customer-submitted reference files on service orders | Signed URL, admin-only, via order detail page |

**Upload flow (admin).** Client → Route Handler `POST /api/admin/media/upload` → server validates MIME allow-list, extension, byte size, and image dimensions → uploads to `public-media` under a UUID path → returns the stored path. The handler re-derives the file name; the client-supplied name is never used as a path segment.

**Download flow (customer).** `POST /api/download/[itemId]` → server loads the `digital_order_items` row → confirms the parent `digital_orders.payment_status = 'PAID'` → confirms `customer_id = auth.uid()` → mints a signed URL with a **120-second TTL** → increments `downloads.download_count` → redirects. There is no code path that returns a `private-products` object URL to an unauthenticated caller.

**Rate limiting.** §7 mandates rate limiting on public forms. Vercel serverless functions have no reliable in-process memory, so a module-level counter is not viable. **Decision:** implement rate limiting in Postgres as a `rate_limits` table plus a `SECURITY DEFINER` function that performs an atomic upsert-and-check in a single statement. This needs no additional vendor, no new credentials, and works across all serverless instances. *(See conflict C6.)*

## 2.6 Payments

The spec (§8) is explicit: build the architecture so a provider can be slotted in later, support manual confirmation now, and **do not simulate successful payments**.

```
src/lib/payments/
  types.ts        PaymentProvider interface (createCheckout, verifyWebhook, refund)
  manual.ts       ManualProvider  — records intent, awaits admin verification
  index.ts        provider registry (reads PAYMENT_PROVIDER env var)
```

- A checkout creates `digital_orders` with `payment_status = 'PENDING'` and `payment_provider = 'manual'`.
- Nothing in the codebase writes `payment_status = 'PAID'`. Only (a) a verified provider webhook or (b) an explicit admin action through a dedicated, separately-audited server action may do so.
- The client-supplied `payment_status` field is never read from the request body; it is stripped by the Zod schema.
- The manual-confirmation admin action writes to `activity_logs` with `entity_type = 'digital_order'` and `metadata = { confirmed_by, reference }`.

**Not implemented in v1:** a live payment provider. The interface, the PENDING state machine, the webhook route stub, and the manual path are all real. The "Pay now" button on the product page creates a PENDING order and shows the studio's manual-payment instructions — it does not pretend to charge a card.

## 2.7 Email

Resend 6.38.0, Node SDK, `resend.emails.send({ from, to, subject, html })`.

Six notification templates (§9): new inquiry, new service order, new digital order, payment confirmation, order status update, customer inquiry confirmation.

**Failure policy (§9):** the database write is the source of truth and always happens first. Email is a *side effect*. If `RESEND_API_KEY` is missing or the API errors, the submission is still stored and the action returns `{ ok: true, emailSent: false, notice: '...' }`. The admin UI shows a non-blocking warning. Form submissions are never discarded because a mail server was down. The Resend key is never exposed to the client.

## 2.8 SEO & performance

- `generateMetadata` per route, with `seo_title` / `seo_description` overrides from the database falling back to the title/description and then to the site-wide SEO defaults in `site_settings`.
- Open Graph + Twitter card metadata; `metadataBase` from `NEXT_PUBLIC_SITE_URL`.
- `src/app/sitemap.ts` — dynamic, generated from published projects, active services, published products, and static routes.
- `src/app/robots.ts` — allows public routes, disallows `/admin`, `/admin-login`, `/api`.
- Canonical URLs on every indexable route.
- JSON-LD structured data: `Organization`/`LocalBusiness` sitewide, `Product` on product pages (with `offers`), `BreadcrumbList` on detail pages, `FAQPage` on service detail.
- `next/image` everywhere; `sizes` tuned per breakpoint; `priority` on the LCP hero image only; lazy loading is the default for everything else.
- Pagination on catalogue and admin list routes via `searchParams` (e.g. `?page=2`), server-rendered.
- Minimise client JS: no chart library on public routes, no animation library in the critical path, filters hydrate only their own subtree.

## 2.9 Accessibility

Semantic landmarks (`header`/`nav`/`main`/`footer`), one `h1` per page with a correct heading order, skip-to-content link, visible `:focus-visible` rings on every interactive element, `aria-*` on all custom controls (filters, mobile menu, accordion, tabs, dialogs), `prefers-reduced-motion` honoured by both CSS and the Motion library, AA contrast minimum for all body text and 3:1 for large text and UI boundaries, labelled inputs with error messages tied via `aria-describedby`, `alt` text required and validated in the admin upload form.

> **Design-token note:** `#FF6B6B` (coral) and `#8CE6C0` (mint) fail AA as a background for white text (2.78:1 and 1.48:1). Both are therefore specified as **surfaces with dark ink** (`#20243A`), never as white-on-colour. Only `#4263EB` (primary) is used as a white-text button background. Full contrast table in [`05-design-system.md`](./05-design-system.md).

## 2.10 Dependency manifest (proposed)

**dependencies**

```jsonc
{
  "next": "16.4.6",
  "react": "19.3.1",
  "react-dom": "19.3.1",
  "@supabase/supabase-js": "2.119.0",
  "@supabase/ssr": "0.12.7",
  "zod": "4.6.7",
  "react-hook-form": "7.91.0",
  "@hookform/resolvers": "7.0.5",
  "resend": "6.38.0",
  "recharts": "3.10.1",
  "motion": "14.12.0",
  "lucide-react": "1.72.0",
  "sonner": "2.0.8",
  "class-variance-authority": "0.7.1",
  "clsx": "2.1.1",
  "tailwind-merge": "3.7.0",
  "tailwindcss": "4.3.5",
  "@tailwindcss/postcss": "4.3.5",
  "tw-animate-css": "1.4.0"
}
```

**devDependencies**

```jsonc
{
  "typescript": "5.9.3",        // pinned — see conflict C1
  "@types/node": "^22",
  "@types/react": "19.3.0",
  "@types/react-dom": "19.3.0",
  "eslint": "10.14.0",
  "eslint-config-next": "16.4.6",
  "prettier": "^3"
}
```

**Deliberately excluded:** `tailwindcss-animate` (v4-incompatible), `framer-motion` (superseded by `motion`), shadcn's `toast` (deprecated in favour of `sonner`), any Redis/Upstash client (see C6), any payment SDK (see C7).

**shadcn/ui is not a runtime dependency.** It is a CLI that copies source into `src/components/ui/`. Primitives are added individually via `npx shadcn@latest add <component>` and committed to the repo, per shadcn's own model. The CLI is not a build or runtime requirement.

## 2.11 Deployment

- **Vercel** — Next.js 16, Node 22 runtime, automatic preview deployments per branch.
- **Supabase** — hosted project, migrations applied via SQL editor or `supabase db push`, storage buckets created by a migration (not by hand), RLS enforced.
- **Environment variables** — 12 documented in `.env.example`: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (server-only), `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `STUDIO_NAME` (fallback to `ngantuqan`), `STUDIO_EMAIL`, `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`, `PAYMENT_PROVIDER`, `RATE_LIMIT_*`, `ADMIN_EMAIL`.
- **Brand source of truth** — the studio name lives in `site_settings` under `studio.name` (default `ngantuqan`), editable in Admin → Settings per §5.J. The `STUDIO_NAME` env var is a **fallback for first boot and email headers only**; it never overrides the database once the setting row exists.
- **Setup, deployment, admin-account creation, and a testing checklist** are delivered as `README.md` at the end of the build (§15).

## 2.12 Quality gates (must pass before "done")

| Gate | Command |
|---|---|
| Type check | `npx tsc --noEmit` |
| Lint | `npx eslint .` (Next 16 removed `next lint`) |
| Production build | `npm run build` (Turbopack — any stray webpack config fails the build) |
| Route smoke test | every route returns 200/302 as expected |
| Authorization test | unauthenticated request to `/admin/*` → redirect; non-admin user → redirect; RLS blocks direct table access |
| Form validation test | client and server both reject invalid input |
| Storage test | public bucket readable; private bucket returns 400/403 without a signed URL |

## 2.13 Explicitly out of scope (v1)

Per §15 *"Do not create unnecessary features beyond the defined project scope."*

- Live payment provider integration (interface + manual path only).
- Customer-facing accounts/login. Guest checkout with order-number + email lookup instead. *(C3)*
- Live chat, blog engine, i18n, multi-currency, coupons/discount codes, wishlists, product reviews, newsletter signup, analytics pixels.
- Automated PDF invoice generation.
- Background job queues — email is sent inline with a bounded timeout and a graceful failure path.
