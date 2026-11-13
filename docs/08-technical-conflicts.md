# 08 — Technical Conflicts & Decisions Required

> Phase 1 deliverable. Per spec §1: *"Any implementation decision that conflicts with this document must be raised with the user before deviating."*
>
> **Nothing in this file has been implemented. Each item awaits your approval.**

## Severity key

| Level | Meaning |
|---|---|
| 🔴 **Blocking** | Implementation cannot start correctly until resolved |
| 🟡 **Decision** | A reasonable default exists; proceeding without a ruling risks rework |
| ✅ **Resolved** | No user input needed — technical fact, already handled |

---

## 🔴 C1 — TypeScript 7 is `latest` but breaks the lint toolchain

**Conflict.** Spec §2 says *"Use the latest compatible stable versions."* `typescript@latest` is now **7.0.2** (the native `tsgo` compiler). But `eslint-config-next@16.4.6` → `typescript-eslint@8.72.2` declares:

```
peerDependencies.typescript: ">=4.8.4 <6.1.0"
```

TypeScript 7 is outside that range. Installing `typescript@latest` yields peer-dependency conflicts and a broken lint/type-check pipeline. Next.js 16 itself requires TypeScript ≥ 5.1.

**Proposed resolution.** Pin `typescript: "5.9.3"` — the newest version inside the supported range, satisfying both Next 16 and typescript-eslint. This satisfies §2's *"compatible"* qualifier rather than its *"latest"* qualifier.

**Impact if rejected.** Lint and typecheck are unreliable; spec §14 criterion 18 (clean production build) and the §16 tracker item *"Lint / typecheck clean"* are at risk.

---

## 🔴 C2 — `@types/node` major version versus the installed runtime

**Conflict.** The machine runs **Node v22.18.0**. `@types/node@latest` is **26.6.6** (Node 26). Typing Node 26 APIs while running Node 22 lets code compile against APIs that do not exist in the deployed runtime, and Vercel's default Node runtime would differ from local.

**Proposed resolution.** Pin `@types/node: "^22"` to match the runtime exactly, and pin the Vercel Node version to 22.x explicitly.

**Related note.** Next 16 requires Node ≥ 20.9. Node 22.18.0 satisfies it.

---

## 🔴 C3 — Customers have no account system, but §8 requires them to download products

**Conflict.** §8 step 5 says *"Customer receives access to purchased products"* and step 6 says *"Generate short-lived signed download URLs."* §5.F says *"Only allow downloads after verified payment"* with a `downloads` table tracking `download_count`. But:

- §4's public route list contains **no customer account area** — no `/account`, no `/login` for customers, no `/my-orders`.
- §5's admin navigation is admin-only.
- §6's `profiles.role` includes `CUSTOMER`, and `service_orders`/`digital_orders` carry `customer_id` — implying accounts exist — yet no flow creates a customer account.
- §2 lists only **Supabase Authentication** for the admin (§5), with no customer-auth requirement.

The purchase flow therefore has no defined landing place for the buyer.

**Proposed resolution.** Guest checkout + order-lookup by email.
1. `/checkout` collects name + email, creates a `digital_orders` row with `customer_id = NULL` (guest) and a unique `order_number`.
2. `/order-confirmation/[orderNumber]` shows the summary. To return later, the customer re-enters the **order number + the email used at checkout**. The email is compared against `digital_orders.customer_email` before anything is shown.
3. Downloads are served from that page, gated on `payment_status = 'PAID'`, minting a 120-second signed URL.
4. `customer_id` remains nullable on both order tables, and is populated later if the same email ever creates an account.

**Alternatives considered.**
- **(a) Full customer accounts** — Supabase Auth sign-up for buyers, a `/account` area. Most faithful to `customer_id`, but adds a customer-facing auth surface the spec never describes, roughly +5 days, and expands the security surface considerably (§7). *Recommended only if you want customer accounts as a product feature.*
- **(b) Email-only magic link** — no password, but still requires the Supabase Auth infrastructure and an email-delivery dependency for the primary access path.

**Cost of the recommendation.** Downloads are self-service without a login, so the order-number + email pair is the security boundary. That pair is guessable in principle, so the mitigation is rate limiting on the lookup plus the fact that a wrong email returns nothing.

**Decision needed:** (a) accounts, (b) magic link, or (c) guest + order/email lookup — *recommended*.

**Ruling (implemented): (c) guest + order/email lookup.** `/checkout` takes a name and an email and creates a `digital_orders` row with `customer_id = NULL`. The customer proves ownership with the order number and the email address; the server checks that pair in the database and issues a signed, expiring access token, so the email never has to sit in a URL. `record_order_download()` re-checks the pair on every download and refuses an unpaid order.

---

## 🔴 C4 — The purchase flow needs two routes the spec does not list

**Conflict.** §4.G requires a **"Purchase button"** on the product detail page. §4.F describes a browsable store with sorting and filtering. §8 defines a purchase → payment → download lifecycle. §5.F requires the admin to manage digital orders with amounts and purchase dates. But §4's route list contains neither a checkout nor a purchase-confirmation page.

A "Purchase" button with no destination cannot be implemented without either inventing routes or removing the purchase capability.

**Proposed resolution.** Add exactly two public routes, both `noindex`:
- `/checkout` — cart review and guest details; creates the `digital_orders` row with `payment_status = 'PENDING'`.
- `/order-confirmation/[orderNumber]` — purchase summary, payment instructions, and (once `PAID`) the download links.

Both are additive and do not alter any spec-listed route. §12's `src/app/(public)/` group already accommodates them.

**Decision needed:** approve the two routes, or specify an alternative.

**Ruling (implemented): approved.** `/checkout` and `/order-confirmation/[orderNumber]` are built, both `noindex`. The confirmation page is the customer's permanent access point.

---

## 🟡 C5 — `service_orders` has no `payment_status` values, and `services` has no publication flag

**Conflict.** §6 gives `services` an `is_active` column, but §5.C describes managing *"Publication status"* for services, while §5.E uses `is_published` for products and §5.B uses `is_published` for projects. Also §5.D lists eight `order_status` values for service orders but never defines `payment_status` values for them — §5.F defines them only for digital orders (§6 lists `payment_status` on both tables).

**Proposed resolution.**
- `services.is_active` **is** the publication flag. The admin UI labels it "Published" / "Active" interchangeably; no new column is added. This keeps §6 exact.
- `service_orders.payment_status` reuses the identical enum `('PENDING','PAID','FAILED','REFUNDED')` defined for digital orders. One enum, two tables — consistent with §6 listing the same column name on both.

**Decision needed:** confirm, or request a separate service-order payment status set.

---

## ✅ C6 — Rate limiting is mandatory but no infrastructure is specified

**Conflict.** §7 mandates *"Rate limiting for public forms."* §2's stack lists Next.js, Supabase, and Resend — no Redis, no Upstash, no rate-limit service. On Vercel, serverless functions have no reliable in-process memory, so a module-level counter is ineffective across instances.

**Proposed resolution.** A Postgres-backed limiter using the Supabase instance already required: a `rate_limits` table plus a `SECURITY DEFINER` function that performs an atomic upsert-and-check in one statement. No new vendor, no new credentials, works across all instances.

**Policy.** 5 submissions per IP per 10 minutes per form type. Exceeding it returns a friendly, non-technical message.

**Alternatives considered.**
- **Upstash Redis** — the conventional choice, but adds a dependency and two credentials the spec never mentions.
- **Vercel Firewall / WAF** — excellent, but a paid tier and an account-level configuration rather than a code-level control.

**Decision: the Postgres limiter is approved and implemented.** Migration `0010_rate_limits.sql` adds the table and `check_rate_limit()`; `src/lib/rate-limit.ts` calls it before every public write. The buckets are `contact`, `order-brief`, `checkout`, `order-lookup`, and `download` — the order lookup is included because the order number is guessable. The client address is stored as an HMAC hash, never as an address, and the limiter fails open so a broken counter cannot stop a real customer. Verified by `npm run check:ratelimit` (23/23).

---

## ✅ C7 — "Do not simulate successful payments" vs. a working checkout button

**Conflict.** §8 says *"Do not simulate successful payments"* and *"Initial implementation: create digital order, save pending payment status& support manual payment confirmation."* But §4.G's "Purchase button" implies the customer can complete a purchase, and §8's step 4 requires the order to *become* `PAID`.

**Proposed resolution.** The payment provider is an interface with one real implementation:

```
src/lib/payments/
  types.ts    PaymentProvider interface
  manual.ts   ManualProvider — records intent, awaits admin verification
  index.ts    registry, selected via PAYMENT_PROVIDER env var
```

The "Purchase" button creates a `PENDING` order and shows the studio's manual payment instructions. **No code path writes `PAID`** except (a) a verified provider webhook or (b) an explicit admin action, both audited in `activity_logs`. The webhook route exists as a real, tested handler ready for a provider. The provider interface is not a stub — it is a complete manual implementation.

**Not implemented in v1.** A live payment provider (Stripe etc.). The §16 tracker already lists *"Payment provider decision (Stripe/Manual only) for final checkout"* as an open item, so this matches the spec's own expectation.

**Decision: manual-only for v1, and the interface is built.** `src/lib/payments/` holds the contract, the manual implementation, and the registry; `PAYMENT_PROVIDER` picks the provider. The checkout asks the provider to prepare the payment and records the provider on the order, the order page asks the provider what to tell the customer, and the studio's confirmation goes through the provider too. The callback route `/api/webhooks/payment/[provider]` verifies the provider's own signature before anything is written, and the write itself is a function only the service role can call.

**What this uncovered.** Supabase grants every new function to `anon` and `authenticated` by default, so `REVOKE & FROM PUBLIC` alone left the browser able to call `confirm_digital_order_payment_from_provider` and mark *any* order paid. The verification script caught it; both provider functions now revoke from `anon` and `authenticated` explicitly. Verified by `npm run check:payments` (19/19).

---

## ✅ C8 — §2 lists "Framer Motion" and §5.I implies a media table that does not exist

**Conflict — two small items.**

1. **Animation library.** §2 says *"Framer Motion or Motion."* `framer-motion` is now the legacy package; the successor is `motion` (v14.12.0), imported from `motion/react`. Both work; `motion` is the maintained path.
2. **Media library storage.** §5.I requires a *"centralized media manager"* with *"file metadata"*, *"file deletion"*, and *"reuse existing media"*. §6 defines no `media` table — storage objects live in Supabase Storage, and §6's `projects.cover_image` / `product_images.image_url` are plain URL strings. Without a table, the library cannot list metadata, and "reuse" means re-uploading.

**Proposed resolution.**
1. Use `motion` v14. Acceptable under §2's own "or Motion" wording.
2. Add a `media` table: `id, bucket, path, file_name, mime_type, file_size, width, height, alt_text, uploaded_by, created_at`, with `UNIQUE (bucket, path)`. `projects.cover_image`, `product_images.image_url`, and `testimonials.avatar_url` store the **media path** rather than a raw URL. A `public-media` bucket makes the URL derivable; a `media-picker` component in the admin browses and reuses existing assets. The library is a genuine, non-duplicating feature rather than a re-upload form.

**Decision: the `media` table is approved and built.** Migration `0013_media.sql` adds it, with the file's name, type, size, alt text, and who uploaded it. Every upload through the admin records a row, every delete removes it, and the library shows what each asset says. The **media-picker** reads from this table: the cover image of a project, service, and product, the avatar of a testimonial, and the **gallery** of a project or product are chosen from the library instead of typed. The catalogue stores the **storage path**, and the address a browser loads is derived from it — so the value survives a change of Supabase project. The `motion` package was installed but never imported, so it was removed and the animation rules are implemented in CSS (see `docs/05` §5.8).

---

## 🟡 C9 — Checkout UX: single-item purchase vs. cart

**Conflict.** §4.G puts a "Purchase" button on a single product page. §6's `digital_order_items` has a `quantity` column and a `digital_orders` → `digital_order_items` one-to-many relationship — implying multi-item orders and therefore a cart. §4 lists no cart route.

**Proposed resolution.** Support **both**, cheaply: "Add to cart" and "Buy now" on the product page; `/checkout` handles 1..n items; `quantity` is editable in the cart. Cart state lives in `sessionStorage` via `use-cart.ts`, and **all prices are recomputed server-side** from the database at checkout — the client never submits a trusted price.

**Decision needed:** approve the cart, or restrict to single-item purchase (simpler, ~1 day less).

---

## 🟡 C10 — `site_settings` key/value must hold structured content for legal pages and homepage

**Conflict.** §4.K requires the four legal pages to use *"editable content from the admin panel"*; §5.J requires managing *"Homepage content"* and *"Theme configuration"*; §5.I requires a media library. §6's `site_settings` is a flat `setting_key` / `setting_value` pair, and §6 says *"Use JSONB only for flexible structured content such as deliverables, package features, or settings"* — which sanctions JSONB here.

**Proposed resolution.** `setting_value` is `jsonb`, holding typed blocks per key:

```jsonc
{
  "studio.name":       { "value": "ngantuqan" },
  "studio.tagline":    { "value": "Creative Design Studio & Digital Marketplace" },
  "home.hero":         { "eyebrow": "&", "headline": "&", "subheadline": "&", "ctaPrimary": "&" },
  "home.whyUs":        { "items": [ { "title": "&", "body": "&" } ] },
  "legal.privacy":     { "title": "&", "updatedAt": "&", "body": "&" },
  "theme":             { "accent": "primary", "radiusScale": "default" }
}
```

`site_settings` rows are only editable from the admin. The public role can read only keys flagged public via an RLS predicate.

**Decision needed:** approve JSONB `setting_value` (the spec's own wording permits it), or specify a separate `pages` / `content_blocks` table.

---

## 🟡 C11 — Seed data vs. the prohibition on fabricated data

**Conflict.** §15 says *"Do not fabricate real customer reviews, purchases, revenue, or analytics"* but also *"If sample content is needed for development, clearly mark it as demonstration data."* §15 requires seed data to be delivered. §5.A wants a revenue figure and §4.A wants testimonials — so a fresh install would show an empty dashboard.

**Proposed resolution.**
- Every seeded row is labelled `DEMO` in its title/name (`"DEMO — Aurora Coffee Rebrand"`), and a `demo-badge.tsx` component marks it on the public site.
- Seeded testimonials carry `DEMO` in `customer_role`.
- **Zero `PAID` digital orders** in the seed, so a fresh install shows `Rp 0` revenue rather than invented numbers. This directly honours *"do not fabricate & revenue, or analytics."*
- The admin overview shows an empty state until real activity exists, with a pointer to the seed script.

**Decision needed:** approve the labelling scheme, or require a completely empty seed (a blank site on first run).

---

## 🟡 C12 — Currency is unspecified

**Conflict.** The spec gives no currency. §6 stores `price`, `discount_price`, `quoted_price`, `budget`, `subtotal`, `total_amount` as numerics with no currency column, and §4.F displays prices. The workspace name (`ngantuqan`) and the studio context suggest Indonesia, but nothing in the spec states a currency.

**Proposed resolution.** Currency lives in `site_settings` as `site.currency` (default `IDR`, formatted `Rp 1.500.000` with the Indonesian locale), rendered by a single `formatCurrency()` helper so changing it is a one-line settings edit. No currency column is added to the order tables — all amounts belong to one studio, one currency.

**Decision needed:** confirm `IDR`, or specify the currency and formatting.

---

## 🟡 C13 — `order_status_history.changed_by` and `activity_logs.admin_id` reference `profiles`

**Conflict.** §6 lists `changed_by` and `admin_id` as bare columns. They must reference `profiles.id` for the audit trail to be meaningful. `profiles.id` = `auth.users.id`, so both are nullable when the actor is the system (e.g. an automatic `NEW_INQUIRY` → `CONTACTED` transition, or a webhook-driven status change).

**Proposed resolution.** Both FKs are `ON DELETE SET NULL`, nullable, with `changed_by`/`admin_id` null meaning "system". No spec conflict — stated here because it affects how the audit trail is read.

**Decision needed:** none — informational. *(Listed so it is not mistaken for an unrecorded design choice.)*

---

## 🟡 C14 — `Next.js 16` API changes the spec's implied workflow

**Conflict.** The spec was written against an earlier Next.js generation. Four breaking changes affect this build:

| Change | Effect here |
|---|---|
| `middleware.ts` → `proxy.ts` | Supabase session refresh must live in `src/proxy.ts`. `proxy` runs on the **Node.js runtime**; Edge is not supported there. |
| `cookies()` / `headers()` / `params` / `searchParams` are now **async** | Every dynamic route awaits `params`; every cookie read awaits `cookies()`. |
| `next lint` removed | Lint runs as `eslint .`; `next build` no longer lints. |
| Turbopack is the default for `dev` **and** `build` | Any `webpack` key in `next.config.ts` fails the build outright. No webpack-loader dependencies are planned. |

Additionally: `revalidateTag()` now requires a `cacheLife` profile as its second argument — the build uses `revalidatePath()` instead, which is simpler and sufficient here. And `images.qualities` now defaults to `[75]`, so image `quality` props are kept at or below 75 unless the config is extended.

**Proposed resolution.** Adopt all of the above. There is no way to keep `middleware.ts` semantics on Next 16 other than staying on Next 15, which would forfeit React 19, Turbopack builds, and `getClaims()` support in Supabase SSR.

**Decision needed:** confirm Next 16.4.6 rather than pinning Next 15.

---

## 🟡 C15 — `next/image` needs `remotePatterns` for the Supabase host

**Conflict.** §11 requires *"Optimized image delivery."* `next/image` refuses to optimise remote URLs that are not in `images.remotePatterns`, and the Supabase project hostname is only known once credentials exist.

**Proposed resolution.** Configure `remotePatterns` from `NEXT_PUBLIC_SUPABASE_URL` at build time, and read images through `lib/storage/buckets.ts` so the pattern is declared once. A single hostname entry covers `public-media`; `private-products` and `private-attachments` are never passed to `next/image` — they are served as signed downloads.

**Decision needed:** none — informational, but it means the image pipeline is untestable until credentials exist.

---

## 🟡 C16 — `@supabase/ssr` 0.12.x requires `getAll`/`setAll` cookie handling and `getClaims()`

**Conflict.** Supabase's current guidance has changed from `getSession()` to `getClaims()` for server-side verification. `getSession()` reads the cookie without revalidating it — trusting it for authorization would let a forged cookie render another user's page (§7 violation).

**Proposed resolution.** `src/proxy.ts` calls `await supabase.auth.getClaims()` to refresh and verify. `lib/supabase/guards.ts` uses `getClaims()` for authorization decisions, never `getSession()`. `getSession()` is used only where the raw token is genuinely needed (none currently).

**Decision needed:** none — informational, and it is a security requirement rather than a preference.

---

## 🟡 C17 — `profiles.id` = `auth.users.id`, but guests have no auth user

**Conflict.** §6 gives `profiles` an `id` and §6's `profiles` roles include `CUSTOMER`. If `profiles.id` must equal `auth.users.id`, a guest buyer (§4.G purchase without an account) cannot have a `profiles` row — yet `service_orders.customer_id` and `digital_orders.customer_id` reference `profiles`.

**Proposed resolution.**
- `profiles.id` = `auth.users.id` (1:1 with the auth user). A trigger creates the `profiles` row on signup with `role = 'CUSTOMER'`.
- `service_orders.customer_id` and `digital_orders.customer_id` are **nullable** FKs to `profiles`. A guest order leaves them null and stores `customer_name` / `customer_email` directly (§6 already has those columns).
- If the same email later creates an account, an admin action can backfill `customer_id` on that customer's orders.
- The admin Customers page lists `profiles` rows with role `CUSTOMER` **plus** guest buyers derived from `distinct customer_email` across both order tables, so no customer is invisible to the studio.

**Decision needed:** approve nullable `customer_id` (the only way to support guest checkout), or require an account for every purchase — which turns C3 into a hard requirement and adds the full customer-auth surface.

---

## 🟡 C18 — `shadcn/ui` is a source-vendoring tool, not a dependency

**Conflict.** §2 lists shadcn/ui as part of the stack, which can read as a runtime package. shadcn/ui is a CLI that copies component source into the repo; it is not published as a consumable library.

**Proposed resolution.** `npx shadcn@latest add <component>` pulls individual primitives into `src/components/ui/`, committed to the repo, styled to the studio's token set. The CLI is not a build or runtime dependency. Two v4-specific details are mandatory:
- `components.json` sets `"tailwind": { "config": "" }` — Tailwind v4 has no `tailwind.config.js`.
- Animations come from `tw-animate-css`, **not** `tailwindcss-animate` (the latter is v3-only and breaks under v4).

Also note shadcn's `toast` primitive is deprecated in favour of `sonner`, which §10's "Toast notifications" requirement is better served by.

**Decision needed:** none — this is how shadcn works; noted so the plan is not misread as a missing dependency.

---

## 🟡 C19 — `next dev`/`next build` with Turbopack and `eslint` 10 flat config

**Conflict.** `next lint` no longer exists, so `eslint-config-next@16.4.6` must be wired into a flat `eslint.config.mjs` directly, and `npm run lint` must invoke `eslint .`. `eslint-config-next` peer-depends on `eslint >= 9`, so ESLint 10.14.0 satisfies it; `typescript-eslint` supports ESLint 10 in its peer range.

**Proposed resolution.** `eslint.config.mjs` extends `eslint-config-next` (flat preset) plus `typescript-eslint`. Scripts:

```jsonc
"lint":      "eslint .",
"typecheck": "tsc --noEmit",
"build":     "next build"
```

CI runs all three as separate steps, since `next build` no longer lints.

**Decision needed:** none — informational, but it changes how "lint clean" is verified versus a Next 15 project.

---

## 🟡 C20 — `profiles` needs an `email` uniqueness rule that survives email changes

**Conflict.** §6 lists `profiles.email` and §6 asks for indexes on email addresses. If `email` is `UNIQUE` and a user changes their auth email, the trigger-driven profile sync must update it, and a conflicting address must fail cleanly rather than silently duplicating.

**Proposed resolution.** `profiles.email` is `UNIQUE`. A trigger on `auth.users` update syncs `full_name` and `email` to the profile. Email changes that collide with an existing profile raise a clear error the admin can see in the Customers list.

**Decision needed:** none — informational.

---

## 🟡 C21 — Project `project_year` may be null for in-progress work

**Conflict.** §6 lists `project_year` on `projects` and §4.C/§4.B display it. The spec's `CHECK (project_year BETWEEN 2000 AND 2100)` cannot be applied to a NULL value in a way that forces a value, and current/ongoing projects may not have a finished year.

**Proposed resolution.** `project_year` is nullable; the check constraint allows NULL and enforces the range when present. The UI shows "In progress" when empty rather than a blank cell.

**Decision needed:** none — informational.

---

## 🟡 C22 — The admin needs a `categories` type for services, but §4.D's service categories are not modelled

**Conflict.** §6's `categories.type` includes `SERVICE`, and §5's admin nav includes a Categories section. But `services` has no `category_id` — only `projects` and `products` do. So the `SERVICE` category type has nothing to attach to, and §4.D's *"Support dynamic service categories"* has no schema behind it.

**Proposed resolution.** Add a nullable `services.category_id` FK to `categories` (filtered to `type = 'SERVICE'`). This is **one additive column** to a §6 table — the minimal change that makes the `SERVICE` category type meaningful and satisfies §4.D.

**Decision needed:** approve the additive column, or confirm services are categorised by a free-text field instead.

---

## 🟡 C25 — §4.J asks for "Required deliverables", but §6 has no column for it

**Conflict.** §4.J lists the project brief's fields, and one of them is *"Required deliverables"* — what the client needs beyond the package scope. §6's `service_orders` column list has no column to hold it: `project_description` is free-text about the project, and `service_packages.features` describe what the studio delivers. Dropping the field would mean the brief loses information the spec explicitly asks for; storing it in `project_description` or `admin_notes` would corrupt a column with a defined meaning.

**Proposed resolution.** One additive nullable column, `service_orders.requested_deliverables text`, added in migration `0007`. Nothing else in §6 changes: no rename, no type change, no dropped constraint. The brief form sends it, the admin order view shows it, and the studio quotes against it.

**Decision needed:** approve the additive column (the implemented state), or confirm that deliverables are communicated outside the brief instead.

---

## ✅ C26 — §2 and §12 name Vercel; the studio is hosted on Cloudflare Workers

**Conflict.** §2 lists the deployment target as *"Vercel"* and §12 asks for the production checklist and the environment variables that platform expects. The studio's owner hosts on Cloudflare: the Workers free plan covers a studio site, the account and the billing stay in one place, and Vercel's Hobby plan is limited to non-commercial use, which a client's site is not.

**Proposed resolution.** Keep the specification's stack and change only where it runs. `@opennextjs/cloudflare` adapts the same Next.js build to the Workers runtime, so the application code is unchanged: the same Server Actions, the same `proxy.ts`, the same Supabase client. Two settings follow from the runtime: the image optimiser is off (`images.unoptimized`), because the Workers runtime has no optimiser and Cloudflare's Image Resizing is a paid add-on; and the file is served as the original.

**Decision: Cloudflare Workers, with Supabase for the database, auth, and storage.** The whole application is verified against the Workers runtime locally with `wrangler dev` (`npm run preview`) — the same suite that runs against `next dev` passes unchanged: 14/14 RLS, 18/18 admin, 34/34 CRUD, 26/26 order, 25/25 checkout, 24/24 rate limit, 19/19 payments. The Worker is 2.43 MiB compressed, inside the 3 MiB free-plan limit. The full procedure is in `docs/09-deployment.md`.

**What it costs.** The Workers free plan allows 10 ms of CPU per request; a heavy admin page can exceed it (error 1106), which the $5/month Workers plan raises. A free Supabase project is paused after seven days without activity.

---

## ✅ C27 — §2 asks the hero for a visual composition; the hero is now text-led

**Conflict.** §2 lists the hero's parts as *"Creative visual composition or featured artwork"* and *"Decorative shapes and graphic elements"*, and §5 asks for organic shapes and decorative stickers throughout. The hero carried all of it: blurred colour fields behind the text, an abstract artwork in a blob-shadowed card, a yellow sticker, a coral dot, and a highlighter under the word "you".

**Decision: the hero carries no decoration at all.** On request, the blurred fields, the artwork, the sticker, the dot, and the highlighter are gone. What is left is the headline, the introduction, the two calls to action, and the three numbers — the type carries the section on its own, at every width.

**What it touches.** The shapes stay where they belong: the work and template cards keep their cover artwork (that is content, not decoration), and the studio introduction keeps its soft mint field. The abstract hero artwork is no longer generated (`scripts/generate-demo-art.mjs`) and the file is gone.

**How it can come back.** A real photograph, rather than an abstract composition, belongs in the hero — and the Media Library with the picker (see C8) is where it goes. The hero is one component (`src/components/home/hero-section.tsx`) and one image slot.

---

## Summary table

| ID | Severity | Topic | Needs a ruling? |
|---|---|---|---|
| C1 | 🔴 | TypeScript 7 breaks `typescript-eslint` | Yes — pin TS 5.9.3 |
| C2 | 🔴 | `@types/node` major vs. runtime | Yes — pin ^22 |
| C3 | 🔴 | No customer account surface for downloads | **Decided — guest checkout + order/email lookup** |
| C4 | 🔴 | Missing checkout + confirmation routes | **Decided — both routes built** |
| C5 | 🟡 | `services.is_active` + shared payment enum | Confirm |
| C6 | ✅ | Rate limiting without Redis | **Decided — Postgres limiter built** |
| C7 | ✅ | Manual payment only in v1 | **Decided — manual provider + interface built** |
| C8 | ✅ | `motion` package; `media` table | **Decided — media table built; `motion` removed (CSS)** |
| C9 | 🟡 | Cart vs. single-item purchase | Yes |
| C10 | 🟡 | JSONB `setting_value` | Confirm |
| C11 | 🟡 | Demo-data labelling | Confirm |
| C12 | 🟡 | Currency unspecified | **Yes — confirm IDR** |
| C13 | 🟡 | Nullable audit FKs | No (informational) |
| C14 | 🟡 | Next 16 breaking changes | Confirm Next 16.4.6 |
| C15 | 🟡 | `images.remotePatterns` | No (informational) |
| C16 | 🟡 | `getClaims()` over `getSession()` | No (security requirement) |
| C17 | 🟡 | Nullable `customer_id` for guests | **Yes — ties to C3** |
| C18 | 🟡 | shadcn vendoring, not a dependency | No (informational) |
| C19 | 🟡 | ESLint 10 flat config, no `next lint` | No (informational) |
| C20 | 🟡 | `profiles.email` uniqueness + sync | No (informational) |
| C21 | 🟡 | Nullable `project_year` | No (informational) |
| C22 | 🟡 | Missing `services.category_id` | **Yes — approve one column** |
| C23 | 🟡 | Brand name `ngantuqan`; wordmark is typographic (no logo file exists) | **Optional — supply a logo file to switch to image mode** |
| C24 | 🟡 | Studio tagline still unknown | **Yes — supply it, or accept the placeholder** |
| C25 | 🟡 | §4.J deliverables field has no §6 column | **Yes — approve one additive column** |
| C26 | ✅ | §2 and §12 name Vercel; the studio hosts on Cloudflare Workers | **Decided — Cloudflare Workers, verified on the runtime** |
| C27 | ✅ | §2 asks the hero for a visual composition | **Decided — the hero is text-led, no decoration** |

**Rulings required: C1, C2, C5, C8, C9, C10, C11, C12, C14, C17, C22, C24, C25.**

Everything else is a technical fact with a determined resolution.

---

## Approval checklist

Please respond on each line. A one-word answer per item is enough.

```
C1  TypeScript → 5.9.3 (not 7.x)          [ yes / no / alternative: ____ ]
C2  @types/node → ^22 (match runtime)       [ yes / no / alternative: ____ ]
C3  Customer access → (a) accounts
                               (b) magic link
                               (c) guest + order/email lookup   → *recommended*
C4  Add /checkout + /order-confirmation/[n]  [ yes / no / alternative: ____ ]
C5  services.is_active = publication flag;
    shared payment_status enum               [ yes / no / alternative: ____ ]
C6  Rate limit via Postgres (no new vendor)  [ yes — approved and built ]
C7  Manual payments only in v1               [ yes — approved and built ]
C8  motion pkg + add `media` table           [ yes / no / alternative: ____ ]
C9  Cart support                             [ yes / single-item only ]
C10 JSONB setting_value                      [ yes / separate pages table ]
C11 DEMO labelling, zero seeded revenue       [ yes / fully empty seed ]
C12 Currency                                 [ IDR / USD / other: ____ ]
C14 Next.js 16.4.6 (not 15)                 [ yes / pin 15 instead ]
C17 Nullable customer_id for guests          [ yes / accounts mandatory ]
C22 Add services.category_id                 [ yes / no / alternative: ____ ]
C23 Wordmark = typographic "ngantuqan."       [ yes / I have a logo file to supply ]
C24 Tagline                                  [ supply: ____________________ / accept placeholder ]
```

**Also outstanding (from the spec's own §16 open-items list):**

- ~~Studio brand name~~ — **resolved: `ngantuqan`.** See §5.2 of the design system for the wordmark spec.
- ~~Real logo asset~~ — **resolved as a decision:** no logo file exists in the repository, so the wordmark is **typographic by default** (`ngantuqan` in Fredoka 600 with a coral terminal dot) and an uploaded image mark in Admin → Settings replaces it with no code change. **Optional, non-blocking:** if a real logo file exists elsewhere, supply it and the lockup switches to image mode.
- **Studio tagline** — still unknown. The seed uses the descriptive, non-promotional default `Creative Design Studio & Digital Marketplace` (taken from the spec's own §1 title, so it asserts nothing false). It is editable in Admin → Settings and should be replaced with the real tagline before launch.
- **Etymology confirmation** — `ngantuqan` is Javanese; the build infers a Krama form of `ngantuk` ("to welcome/receive a guest"). This inference is **not written into the product**. Confirm it before it is used in the `/about` brand story, or author that story directly in Admin → Website Content.
- Supabase project URL, publishable key, and secret key.
- Resend API key and a verified sending domain.
- Real product files and real client testimonials.

**Until the rulings above are given, no implementation code will be written.**
