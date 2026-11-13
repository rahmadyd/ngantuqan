# ngantuqan

Creative Design Studio & Digital Marketplace — portfolio, design services with a
project-brief order flow, and a downloadable digital product shop.

Built from [`master_design.md`](./master_design.md) (the approved specification).
Planning documents live in [`docs/`](./docs/).

---

## Accessing the admin dashboard locally

The local Supabase stack runs on your machine. Start it, then sign in:

```bash
# 1. Start the local Supabase stack (Postgres, Auth, Storage, Studio)
npx supabase start -x realtime,imgproxy,edge-runtime,logflare,vector,supavisor,analytics

# 2. Apply migrations + seed data, and create the admin account
npx supabase db reset
npm run admin:create

# 3. Start the app
npm run dev
```

Then open:

| | |
|---|---|
| **Admin dashboard** | http://localhost:3000/admin |
| **Sign-in page** | http://localhost:3000/admin-login |
| **Supabase Studio** | http://127.0.0.1:54323 |
| **Mailpit (local mail)** | http://127.0.0.1:54324 |

**Admin credentials**

```
Email:    admin@ngantuqan.studio
Password: ngantuqan-admin-dev
```

> The password is a local development default. Change it before deploying
> anywhere, or set `ADMIN_PASSWORD` when running `npm run admin:create`.

`.env.local` is already pointed at the local stack:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

### How the admin guard works

Three independent layers — all three must pass:

1. **`src/proxy.ts`** — refreshes the session and redirects `/admin/*` to
   `/admin-login` when there is no session or the role is not `ADMIN`.
2. **`src/lib/supabase/guards.ts`** — `requireAdmin()` runs in the admin
   layout and on every server action. This is the real authorization check.
3. **Row Level Security** — 45 table policies and 9 storage policies in
   Postgres. Verified by `npm run check:rls`.

Hiding a nav link is not a control; the check always happens on the server.

---

## Status

| Area | State |
|---|---|
| Design system + UI primitives | ✅ complete |
| Public website (16 routes) | ✅ complete, reads from Postgres |
| Supabase schema, RLS, storage, auth | ✅ complete, 9 migrations |
| Admin dashboard (13 sections) | ✅ complete — create, edit, delete, order management, media library |
| Project brief | ✅ complete — `/order/[service-slug]`, private attachments, confirmation |
| Checkout + order confirmation | ✅ complete — guest checkout, signed downloads |
| Payment provider | ✅ interface + registry + callback route; the manual provider is the only implementation |
| Email notifications | ✅ Resend client, branded layout, 6 templates + admin reply |
| Rate limiting | ✅ complete — Postgres-backed, 5 per address per 10 min per form |
| Deployment | ✅ Cloudflare Workers + Supabase — one command, free tier sized |
| Image optimisation | ✅ Cloudflare's image service — resized and converted on the edge |

**Content comes from Postgres.** Every record is prefixed `DEMO` and no
revenue, purchase, or testimonial is presented as real — the seed creates zero
paid orders, so revenue reads `Rp 0` on a fresh install.

---

## Stack

Next.js 16.4.6 (App Router) · React 19.3.1 · TypeScript 5.9.3 · Tailwind CSS
4.3.5 · Supabase (Postgres + Auth + Storage) · Resend 6.38.0 · Zod 4.6.7 ·
React Hook Form 7.91.0 · Lucide · Motion 14.12.0

> **TypeScript is pinned to 5.9.3, not `latest`.** TypeScript 7 is outside the
> `typescript-eslint` peer range (`>=4.8.4 <6.1.0`) that `eslint-config-next`
> requires, so installing 7 breaks the lint pipeline. See `docs/08`.

---

## Getting started

```bash
npm install
cp .env.example .env.local   # already configured for the local stack
npm run dev                  # http://localhost:3000
```

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build (Turbopack) |
| `npm run preview` | Build for Cloudflare and serve it on the Workers runtime |
| `npm run deploy` | Build for Cloudflare and deploy the Worker |
| `npm run upload` | Build for Cloudflare and upload without switching traffic |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint 10 flat config |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` |
| `npm run gen:types` | Regenerate `database.types.ts` from the local DB |
| `npm run admin:create` | Create/promote the local admin account |
| `npm run check:rls` | Verify RLS with the anonymous key |
| `npm run check:storage` | Verify bucket visibility + signed URLs |
| `npm run check:auth` | Admin sign-in / sign-out / guard flow |
| `npm run check:admin` | Every admin section renders with real data |
| `npm run check:crud` | Admin CRUD end-to-end — create, edit, delete, orders, media, audit trail |
| `npm run check:order` | Project brief end-to-end — validation, storage, confirmation, admin view |
| `npm run check:checkout` | Guest checkout end-to-end — order, access control, paid download |
| `npm run check:ratelimit` | Rate limiting — the counter, bucket isolation, the hashed address |
| `npm run check:payments` | The payment provider — the order, the callback, both audited paths to paid |
| `npm run check:email` | Every email template — recipient, subject, branding, escaping |
| `npm run check:content` | Public site reads the DB; contact form persists |
| `npm run check:validation` | Contact-form schema test |
| `npm run generate:demo-art` | Regenerate the demo artwork SVGs |

> Next.js 16 removed `next lint` and no longer lints during `next build`.
> Run `npm run lint` separately in CI.

---

## Database

Twelve migrations in `supabase/migrations/`, applied in order by `supabase db reset`
or `supabase db push` against a hosted project.

| File | Contents |
|---|---|
| `0001_extensions_and_enums.sql` | `pgcrypto`, `pg_trgm`, 6 enum types |
| `0002_tables.sql` | 19 tables, 38 indexes, constraints, composite FKs |
| `0003_triggers.sql` | `updated_at`, profile sync, order numbering, status history, delete guards |
| `0004_rls_policies.sql` | 45 policies, `is_admin()` / `current_customer_id()` helpers |
| `0005_storage.sql` | 3 buckets + 9 storage policies |
| `0006_functions.sql` | `record_purchase`, `confirm_digital_order_payment`, `record_download`, admin metrics |
| `0007_service_order_deliverables.sql` | `service_orders.requested_deliverables` + `record_service_order()` |
| `0008_checkout.sql` | `record_order_download()` + the `payments.details` content block |
| `0009_fix_record_purchase.sql` | Fixes the price lookup in `record_purchase` |
| `0010_rate_limits.sql` | `rate_limits` table + the atomic `check_rate_limit()` function |
| `0011_payment_provider.sql` | `record_purchase` takes the provider + the provider-only payment confirmation |
| `0012_admin_overview_counts.sql` | The overview counts every service, so the card can say how many are live |
| `0013_media.sql` | The `media` table — the library's own index of the studio's files |

**Storage buckets**

| Bucket | Visibility | Contents |
|---|---|---|
| `public-media` | public | Portfolio/product previews, avatars |
| `private-products` | private | Purchasable files — signed URLs only, 120s TTL |
| `private-attachments` | private | Client reference files |

**The media table**

The library keeps its own index of what the studio has: each file's bucket,
path, original name, type, size, alt text, and who uploaded it. Storage is a
keyspace — a file is only a path — so this is where what the studio knows
about an asset lives. An upload records a row, a delete removes it, and the
Media Library lets the alt text be edited.

**The picker**

An image is chosen, not typed. The cover image of a project, a service, and a
product, and the avatar of a testimonial, open the library in a dialog and
save the asset's **storage path** — the address a browser loads is derived
from it, so the value survives a change of Supabase project.

**The gallery**

The images of a project or a product are edited in the same place: chosen
from the library, given their own alt text, moved up and down, and saved in
the order they appear on the public page.

---

## Environment variables

See `.env.example` for the full list with comments.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap, robots |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
| `SUPABASE_SECRET_KEY` | **Server-only.** Signed URLs, privileged storage writes |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | Public bucket name |
| `RESEND_API_KEY` | Transactional email. Omit to run without |
| `STUDIO_EMAIL` | Where enquiries are delivered |
| `ADMIN_EMAIL` | Email permitted to access `/admin` |

**Never prefix a secret with `NEXT_PUBLIC_`.**

---

## Routes

**Public** — `/` · `/work` · `/work/[slug]` · `/services` · `/services/[slug]` ·
`/shop` · `/shop/[slug]` · `/about` · `/contact` · `/privacy-policy` ·
`/terms-and-conditions` · `/refund-policy` · `/digital-product-license` ·
`/order/[service-slug]` · `/order/[service-slug]/submitted` · `/checkout` ·
`/order-confirmation/[orderNumber]`

**Admin** — `/admin-login` · `/admin` · `/admin/portfolio` · `/admin/services` ·
`/admin/service-orders` · `/admin/products` · `/admin/digital-orders` ·
`/admin/customers` · `/admin/inquiries` · `/admin/testimonials` ·
`/admin/categories` · `/admin/content` · `/admin/media` · `/admin/settings`

Each section also has an editor route — `/admin/portfolio/[id]`,
`/admin/services/[id]` (+ `/admin/services/[id]/packages/[packageId]`),
`/admin/products/[id]`, `/admin/categories/[id]`, `/admin/testimonials/[id]`,
`/admin/service-orders/[id]`, `/admin/digital-orders/[id]`,
`/admin/inquiries/[id]`, `/admin/content/[id]`, `/admin/customers/[id]`. The id
`new` opens the same screen in create mode.

**Pending** — `/order/[service-slug]` · `/checkout` ·
`/order-confirmation/[orderNumber]`

---

## Project structure

```
src/
  app/
    (public)/        public routes + public shell layout
    (auth)/          admin-login
    admin/           admin dashboard (13 sections)
    api/admin/       admin media upload + file streaming
    api/download/    gated signed-URL minting
    globals.css      design tokens + @theme inline mapping
    layout.tsx       fonts, metadata, metadataBase
    proxy.ts         session refresh + admin route gate
    sitemap.ts       dynamic sitemap from published content
    robots.ts        disallows /admin, /admin-login, /api
  components/
    ui/              primitives
    layout/          header, nav, footer, logo, section primitives
    admin/           admin shell, sidebar, stat card, data table, form engine
    forms/           contact form, project brief form, restore helper
    home/ portfolio/ services/ shop/ about/ common/
  lib/
    supabase/        server, browser, admin (service role), guards, storage
    queries/         read layer — Supabase with demo fallback
    actions/         Server Actions (auth, inquiries, orders, checkout, admin mutations)
    validations/     Zod schemas (shared client + server)
    orders/          signed access tokens for guest order lookup
    email/           Resend client and templates
    payments/        the payment provider contract, the manual provider, the registry
    queries/         the read layer — the published catalogue, cached for a minute
    rate-limit.ts    Postgres-backed limiter for the public forms
    data/demo.ts     DEMONSTRATION DATA — never the production source
  types/
    database.types.ts   generated from the database
    models.ts           domain models
scripts/             verification and asset-generation scripts
supabase/            migrations + seed
wrangler.jsonc       the Cloudflare Worker: bindings, public variables
open-next.config.ts  the OpenNext adapter configuration
docs/                planning documents
```

---

## Design system

Defined in `src/app/globals.css` as CSS custom properties, mapped into
Tailwind v4 via `@theme inline`. Full rationale, contrast audit, and usage
rules in [`docs/05-design-system.md`](./docs/05-design-system.md).

**Palette** — primary `#4263EB` · secondary `#FFE66D` · coral `#FF6B6B` ·
mint `#8CE6C0` · background `#FFFDF7` · text `#20243A`

Only primary carries white text (4.98:1). Coral, mint, and secondary are
surfaces with dark ink, because white-on-those fails WCAG AA (2.78:1 and
1.48:1). Muted text `#6E707C` sits at 4.83:1 on the cream background.

**Type** — Fredoka (display) · Inter (body) · Space Grotesk (labels)

**Wordmark** — `ngantuqan` in Fredoka 600 with a coral terminal dot. The
repository ships no logo asset, so the mark is typographic; an uploaded image
in Admin → Settings replaces it with no code change.

---

## Verification performed

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` | clean |
| Typecheck | `npm run typecheck` | clean |
| Production build | `npm run build` | clean — 46 routes (42 pages + 4 route handlers) |
| RLS isolation | `npm run check:rls` | 14/14 |
| Storage visibility | `npm run check:storage` | 7/7 |
| Admin auth flow | `npm run check:auth` | 10/10 |
| Admin sections | `npm run check:admin` | 18/18 |
| Admin CRUD | `npm run check:crud` | 53/53 |
| Project brief | `npm run check:order` | 26/26 |
| Guest checkout | `npm run check:checkout` | 25/25 |
| Rate limiting | `npm run check:ratelimit` | 24/24 |
| Payment provider | `npm run check:payments` | 19/19 |
| Email templates | `npm run check:email` | 50/50 |
| Content flow | `npm run check:content` | 8/8 |
| Form validation | `npm run check:validation` | 7/7 |
| Responsive | `node scripts/capture-screenshots.mjs` | 390px & 1440px, public + admin, no overflow |

---

## How the admin panel writes

Every mutation goes through a Server Action in `src/lib/actions/admin-*.ts`.
The pattern is the same for all of them:

1. `assertAdmin()` — the action re-checks the role. A hidden button is not a
   control, and a Server Action is a public endpoint.
2. Zod validation in `src/lib/validations/admin.ts` — the client only ever
   supplies field values and an id; the row is re-read from the database.
3. The write, with the user's session, so RLS applies and `auth.uid()` is set.
4. `log_activity` — an audit row per mutation (create, update, delete, status
   change, reply, payment update).
5. `revalidatePath` — the admin list and the public routes that mirror the
   catalogue are re-rendered.

Destructive actions are confirmed twice: the first click arms the button, the
second performs it. Published projects and products cannot be deleted at all —
the database refuses it until they are unpublished.

---

## The project brief

`/order/[service-slug]` captures a brief (spec §4.J): who, which service and
package, the description, the audience, the references, the palette, the
deliverables asked for, the budget, the deadline, and an optional reference
file.

- The service and the package are resolved **server-side**. A package that
  belongs to another service is rejected, and a package or service that was
  retired in the meantime cannot be ordered.
- The order is created by the `record_service_order()` function, so the order
  number is generated by the database and never comes from the browser.
- The reference file goes to the private `private-attachments` bucket under a
  generated path. It is never served from a public URL.
- The confirmation page shows the reference, the service, the package, and the
  status — and nothing else. A guessed order number reveals no name, no email,
  no brief, and no budget.
- Nothing is marked as paid. A brief is not an order; the studio quotes first.

---

## Email

`src/lib/email/send.ts` holds every template. One shell, one escaping rule,
one delivery path — `deliver()` never throws, it reports, because the spec is
explicit that a mail failure must never discard a submission.

| Template | Recipient | Fires when |
|---|---|---|
| New inquiry | studio | a contact-form submission lands |
| Customer inquiry confirmation | customer | the same submission |
| New service order | studio | a project brief lands |
| Service order confirmation | customer | the same brief |
| New digital order | studio | a purchase lands (fires with the checkout) |
| Payment confirmation | customer | the studio confirms a payment |
| Order status update | customer | the studio moves a service order on |
| Admin reply | customer | the studio replies to an inquiry |

Everything the customer typed is escaped before it reaches the HTML. Set
`RESEND_API_KEY` and a verified sending domain to switch it on; without them
each send is skipped, logged, and reported — the order or the inquiry is
stored either way.

---

## Buying a digital product

There is no customer account. The order number and the email address used at
checkout are the security boundary (conflict C3, option c).

1. The cart lives in `sessionStorage`. `/checkout` reviews it and takes a name
   and an email.
2. The order is created by `record_purchase()`, which reads the prices from
   the products table — a client-supplied price is never trusted — and starts
   the order as `PENDING`.
3. The confirmation page shows the summary and the payment instructions. The
   studio confirms the payment by hand, and only then do the downloads appear.4. The customer proves ownership with the order number and the email address.
   The server checks that pair in the database and issues a signed, expiring
   access token, so the email address never has to sit in a URL.
5. Each download is minted on click, not baked into the page: signed URLs last
   two minutes. `record_order_download()` re-checks the pair, refuses an
   unpaid order, and counts the download.

Set `ORDER_ACCESS_SECRET` (server-only) to sign the access tokens. It falls
back to `SUPABASE_SECRET_KEY` when it is not set.

---

## The payment provider

Payment is an interface, not a hard-coded path. `src/lib/payments/` holds the
contract, the registry, and one real implementation:

| File | Role |
|---|---|
| `types.ts` | The `PaymentProvider` contract — prepare, instructions, confirm by hand, verify a callback |
| `manual.ts` | The manual provider: the studio's bank transfer instructions, confirmed in the dashboard |
| `index.ts` | The registry (`PAYMENT_PROVIDER` picks the provider) and the shared flows |

The customer is never told how to pay by the checkout. The checkout asks the
provider to prepare the payment and records which provider handled the order
in `digital_orders.payment_provider`; the order page asks the provider what to
tell the customer. For the manual provider that is the `payments.details`
content block, editable in Admin → Website Content.

Two paths may mark an order `PAID`, and only two:

1. **The studio confirms it** in the admin dashboard. The write goes through
   `confirm_digital_order_payment`, which re-checks the role in the database,
   and the action writes an audit row naming the administrator.
2. **A provider callback** at `/api/webhooks/payment/[provider]`. The provider
   verifies its own signature first — an unsigned callback is refused — and
   only then does `confirm_digital_order_payment_from_provider` write the
   order and its own audit row. That function is granted to the service role
   alone, so the browser cannot call it.

No payment is ever simulated. Adding Stripe later means one file in
`src/lib/payments/`, its signing secret, and a dependency — the checkout, the
order page, and the download gate do not change.

---

## Deploying

The site runs on **Cloudflare Workers**, with **Supabase** for the database,
the auth, and the storage. The specification named Vercel; the deviation is
recorded in [`docs/08`](./docs/08-technical-conflicts.md) (C26) and the full
procedure is in [`docs/09-deployment.md`](./docs/09-deployment.md).

```bash
# 1. Apply the migrations to the hosted database
npx supabase link --project-ref <YOUR-PROJECT-REF>
npx supabase db push

# 2. Set the secrets once
npx wrangler secret put SUPABASE_SECRET_KEY
npx wrangler secret put ORDER_ACCESS_SECRET

# 3. Build and deploy
npm run deploy
```

`npm run preview` serves the production build on the Workers runtime locally,
so the whole verification suite can run against the runtime that actually
hosts the site.

---

## Performance

The site is built to be quick on a phone and to survive a free tier.

| What | How |
|---|---|
| **The catalogue is cached** | The published reads go through a one-minute cache (`src/lib/cache.ts`) and an admin write drops it, so the studio sees its own edit straight away. A second visitor costs zero database round trips. |
| **The reads are cookie-free** | The public client carries no session, so a cached read never depends on the request — and no page can change from static to dynamic at runtime. |
| **The pages are always rendered fresh** | `force-dynamic` on the public layout: the catalogue is never frozen into a build. |
| **The form pages are not prefetched** | Next prefetches a linked route's client chunks too. The catalogue pages are light and worth having ready; the contact and checkout pages carry the validation library (about 140 KB) and most visitors do not open them straight away. |
| **The charts arrive late** | The dashboard's charting library is about 400 KB. It loads after the page, behind a skeleton, so the numbers are readable first. |
| **The admin draws its own charts** | Two series over twelve months is a fraction of the code: the dashboard's charts are hand-drawn SVG, so the charting library is gone from the bundle. |
| **The admin prefetches nothing on sight** | Opening a section rendered every section in the background — thirteen page renders, each with its own queries. A section is prepared when the pointer moves towards it instead. |
| **The images are transformed on the edge** | Cloudflare's image service (the `IMAGES` binding) resizes and converts the uploaded images: a 100 KB PNG becomes a 1.2 KB WebP. The free plan allows 5,000 unique transformations a month. |
| **The Worker is small** | 2.24 MB compressed, inside the 3 MiB free-plan limit — a smaller bundle is a faster cold start. |

Measured on the production build (`next start`), warm:

| Page | TTFB | First paint | Requests | JS |
|---|---|---|---|---|
| `/` | ~40 ms | ~250 ms | 19 | ~520 KB |
| `/work` | ~100 ms | ~220 ms | 45 | ~520 KB |
| `/shop` | ~25 ms | ~95 ms | 37 | ~520 KB |

> A hosted database is a network hop away, and a warm cache means a page
> costs no queries at all — that is where the biggest win is, and it is not
> visible in a local measurement.

---

## Rate limiting

The public forms and the order lookup are throttled. The counter lives in
Postgres — a `rate_limits` table and one `SECURITY DEFINER` function that
increments and answers in a single statement — so the limit behaves the same
on every serverless instance and needs no vendor, no Redis, and no extra
credential (conflict C6).

- 5 requests per address per 10 minutes, per bucket: `contact`,
  `order-brief`, `checkout`, `order-lookup`, and `download`.
- The address is stored as an HMAC hash. The raw address never reaches the
  database.
- The limit is enforced in the Server Action, before the write — a refused
  request stores nothing.
- The refusal is a sentence, not a status code: "please try again in about 9
  minutes, or email us and we will pick it up right away."
- The limiter fails open. If the database cannot be reached the request is
  allowed through and the failure is logged — a broken counter must not stop a
  real customer.

`RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_SECONDS` set the policy.

---

## Not yet built

- **A live payment provider.** Payment is manual: the order stays `PENDING`
  until the studio confirms it in the admin panel. The interface, the
  registry, and the callback route are built and waiting for one.
- **Hosted credentials.** The local stack runs on your machine; deployment
  needs a hosted Supabase project, a verified sending domain for Resend, and
  real product files. The procedure is in [`docs/09-deployment.md`](./docs/09-deployment.md).

---

© ngantuqan
