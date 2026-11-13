# 07 — Development Roadmap

> Phase 1 deliverable. Implementation order, dependencies, and exit criteria per phase. Mirrors the spec's §13 workflow, extended with concrete deliverables and gates.

## 7.1 Phase overview

| Phase | Name | Depends on | Gate |
|---|---|---|---|
| 0 | Foundation & scaffolding | — | App boots, lint + typecheck + build green |
| 1 | Database & auth | 0 | Migrations applied, RLS verified, admin can log in |
| 2 | Design system & shells | 0 | Tokens live, primitives vendored, both layouts render |
| 3 | Public website | 1, 2 | Every public route returns real DB data |
| 4 | Admin dashboard | 1, 2 | Full CRUD on all 13 nav sections |
| 5 | Integrations | 3, 4 | Email sends, payments gated, downloads signed |
| 6 | Testing & hardening | 3, 4, 5 | All acceptance criteria pass |
| 7 | Deployment & handoff | 6 | Production build deployed, docs delivered |

Phases 1 and 2 are independent after Phase 0 and can run in parallel. Phase 3 depends on Phase 1 for data and Phase 2 for the shell.

---

## Phase 0 — Foundation & scaffolding

**Goal:** a running Next.js 16 application with the exact stack, a clean lint/typecheck/build pipeline, and no features.

| # | Task | Output |
|---|---|---|
| 0.1 | `git init`, `.gitignore`, initial commit of `master_design.md` | Repo baseline |
| 0.2 | `create-next-app@16.4.6` with `--ts --tailwind --app --src-dir --import-alias "@/*"` | Next 16 + Tailwind v4 + TS 5.9 scaffold |
| 0.3 | Install pinned dependencies per §2.10 | `package.json` |
| 0.4 | Configure ESLint flat config (`eslint-config-next`) + `npm run lint` → `eslint .` | Lint gate working |
| 0.5 | `npm run typecheck` → `tsc --noEmit` | Type gate working |
| 0.6 | `next.config.ts`: `images.remotePatterns` for the Supabase project host | Image pipeline ready |
| 0.7 | `proxy.ts` scaffold (Node runtime) with a no-op pass-through | Session-refresh slot ready |
| 0.8 | `.env.example` (12 documented vars, no secrets) + `src/lib/env.ts` with a zod-validated schema | Config contract |
| 0.9 | `src/types/` — hand-written `database.types.ts` mirroring the planned DDL (replaced by generated types once credentials exist) | Types available pre-credentials |
| 0.10 | `src/lib/utils.ts` — `cn()`, `formatCurrency()`, `slugify()`, `formatDate()` | Shared utilities |
| 0.11 | Verify `npm run build` succeeds with Turbopack and **no** webpack config | Build gate green |

**Exit criteria:** `npm run lint`, `npm run typecheck`, `npm run build` all pass. The dev server renders the default page.

**Risk:** `next build` fails outright if any `webpack` key exists in `next.config.ts`. Keep it Turbopack-only.

---

## Phase 1 — Database & authentication

**Goal:** a live Supabase project with the full schema, RLS, storage, and a working admin login. This phase unblocks everything else.

| # | Task | Output |
|---|---|---|
| 1.1 | Write `0001_extensions_and_enums.sql` | Enums |
| 1.2 | Write `0002_tables.sql` | 20 tables, indexes, constraints, composite FKs |
| 1.3 | Write `0003_triggers.sql` | `set_updated_at()`, order-number generator, profile auto-create on signup, delete guards |
| 1.4 | Write `0004_rls_policies.sql` | `is_admin()`, `current_customer_id()`, full policy matrix |
| 1.5 | Write `0005_storage.sql` | 3 buckets + storage policies |
| 1.6 | Write `0006_functions.sql` | `generate_order_number()`, `record_purchase()`, `record_download()`, `admin_revenue_summary()` |
| 1.7 | Write `supabase/seed.sql` — demo content, clearly `DEMO`-labelled, **zero paid orders** | Seed |
| 1.8 | `src/lib/supabase/{client,server,admin}.ts` + `guards.ts` | Supabase layer |
| 1.9 | `src/proxy.ts` — full session refresh via `getClaims()`, `/admin/**` redirect | Auth gate |
| 1.10 | `/admin-login` page + `lib/actions/auth.ts` (sign in, sign out) | Login works |
| 1.11 | Admin bootstrap SQL script — promote the first user to `ADMIN` | `supabase/README.md` |
| 1.12 | **RLS verification** — unauthenticated anon key must not read a single unpublished row; a customer must not read another customer's order | Security proof |

**Exit criteria:** migrations apply cleanly; admin can sign in; RLS verified with the anon key; service-role key exists only in server-only modules.

**Blocked without credentials:** 1.1–1.7 can be authored blind, but 1.8–1.12 need a live project. If credentials are unavailable, this phase proceeds to authoring only, and the seed is validated by parsing, not by running.

---

## Phase 2 — Design system & shells

**Goal:** the visual language and both page shells, so every later page is composed rather than designed from scratch.

| # | Task | Output |
|---|---|---|
| 2.1 | `globals.css` — design tokens as CSS variables, `@theme inline` Tailwind mapping | Token layer |
| 2.2 | Fonts via `next/font/google` (Fredoka, Inter, Space Grotesk) | Typography |
| 2.3 | Vendor shadcn primitives into `src/components/ui/` (`new-york` style, lucide icons) | Primitives |
| 2.4 | Custom primitives: `empty-state.tsx`, status badge variants | Studio-specific UI |
| 2.5 | `container.tsx`, `section.tsx`, `section-heading.tsx`, `page-hero.tsx` | Layout primitives |
| 2.6 | `site-header.tsx`, `site-nav.tsx`, `mobile-nav.tsx`, `site-footer.tsx`, `skip-link.tsx` | Public chrome |
| 2.7 | `(public)/layout.tsx` | Public shell |
| 2.8 | `(auth)/layout.tsx` | Auth shell |
| 2.9 | `admin/layout.tsx` + `admin-shell.tsx`, `admin-sidebar.tsx`, `admin-topbar.tsx` | Admin shell |
| 2.10 | `motion/reveal.tsx`, `stagger.tsx`, reduced-motion provider | Motion layer |
| 2.11 | `components.json` with `"tailwind": { "config": "" }` (v4 has no config file) | shadcn config |
| 2.12 | `tw-animate-css` wired in place of `tailwindcss-animate` | Animations |

**Exit criteria:** both shells render; the token set passes the contrast audit in `05-design-system.md`; no hard-coded hex outside `globals.css`.

---

## Phase 3 — Public website

**Goal:** every public route live against the database.

### 3A — Portfolio

| # | Task |
|---|---|
| 3A.1 | `lib/queries/projects.ts` — published-only queries with narrow projections |
| 3A.2 | `/work` — grid, category filter, title search, pagination via `searchParams` |
| 3A.3 | `project-card.tsx`, `project-filters.tsx`, `featured-project.tsx` |
| 3A.4 | `/work/[slug]` — metadata, gallery, objectives/concept/process, related projects, CTA |
| 3A.5 | `project-gallery.tsx`, `project-meta.tsx`, `related-projects.tsx` |
| 3A.6 | JSON-LD `CreativeWork` on detail pages |

### 3B — Services

| # | Task |
|---|---|
| 3B.1 | `lib/queries/services.ts` |
| 3B.2 | `/services` — grid with accent-cycling cards |
| 3B.3 | `/services/[slug]` — packages, pricing, deliverables, benefits, FAQ, revision limits, delivery |
| 3B.4 | JSON-LD `Service` + `FAQPage` |

### 3C — Shop

| # | Task |
|---|---|
| 3C.1 | `lib/queries/products.ts` |
| 3C.2 | `/shop` — grid, search, category filter, sort (price, newest), pagination |
| 3C.3 | `/shop/[slug]` — gallery, specs, license, what's included, purchase button |
| 3C.4 | JSON-LD `Product` with `offers` |
| 3C.5 | `use-cart.ts` — sessionStorage cart, server recomputes all prices |

### 3D — Static + content pages

| # | Task |
|---|---|
| 3D.1 | `/about` — story, vision, mission, philosophy, capabilities, tools, workflow |
| 3D.2 | `/privacy-policy`, `/terms-and-conditions`, `/refund-policy`, `/digital-product-license` — rendered from `site_settings` |
| 3D.3 | `sitemap.ts`, `robots.ts`, `metadataBase`, canonical URLs |

### 3E — Forms + order flow

| # | Task |
|---|---|
| 3E.1 | `validations/contact.ts` + `lib/actions/inquiries.ts` → `inquiries` + email |
| 3E.2 | `/contact` — full form, client + server validation, loading/success/error states |
| 3E.3 | `validations/service-order.ts` + `lib/actions/service-orders.ts` → `service_orders` + `order_status_history` (initial `NEW_INQUIRY`) + reference number |
| 3E.4 | `/order/[service-slug]` — brief form incl. reference file upload, package pre-select via `?package=` |
| 3E.5 | `/order/[service-slug]/submitted` — confirmation with reference |
| 3E.6 | `/checkout` → `lib/actions/digital-orders.ts` → `digital_orders` (`PENDING`) + `digital_order_items` |
| 3E.7 | `/order-confirmation/[orderNumber]` — summary, payment instructions, order lookup by email |

**Exit criteria:** every public route renders live DB data; all forms validate on both sides and persist; no route returns a hard-coded array.

---

## Phase 4 — Admin dashboard

**Goal:** full content and order management, all 13 navigation sections working.

| # | Task | Section |
|---|---|---|
| 4.1 | Overview — stat cards, Recharts revenue + orders, recent inquiries/orders/activity | §5.A |
| 4.2 | `lib/actions/projects.ts` + portfolio CRUD + publish/feature toggles | §5.B |
| 4.3 | Services + packages CRUD, `jsonb-editor` for deliverables/features | §5.C |
| 4.4 | Service orders — list, search, status filter, detail, brief, attachments, status update + history, notes, quoted price | §5.D |
| 4.5 | Products CRUD + preview images + product files + publish/feature | §5.E |
| 4.6 | Digital orders — list, detail, **manual payment confirmation** | §5.F |
| 4.7 | Customers — list, order history per customer | §5 |
| 4.8 | Inquiries — list, search, read/unread, status, reply via email, spam delete | §5.G |
| 4.9 | Testimonials CRUD | §5.H |
| 4.10 | Categories CRUD (PORTFOLIO / SERVICE / PRODUCT) | §5 |
| 4.11 | Website content editor (homepage blocks, about blocks, legal bodies) | §5.J |
| 4.12 | Media library — upload, preview, metadata, delete, reuse | §5.I |
| 4.13 | Settings — studio name, logo, tagline, email, socials, footer, SEO defaults, theme | §5.J |
| 4.14 | `activity_logs` written on every mutation | §5.A |

**Exit criteria:** every nav item reachable and functional; every CRUD operation writes to the DB and is reflected on the public site; destructive actions confirm.

---

## Phase 5 — Integrations

| # | Task | Detail |
|---|---|---|
| 5.1 | Resend client + branded email layout + 6 templates | §9 |
| 5.2 | Graceful degradation — missing key or API failure must not discard a submission | §9 |
| 5.3 | Payment provider interface + `ManualProvider` + registry | §8 |
| 5.4 | `payments/webhook` route stub ready for a real provider | §8 |
| 5.5 | Signed download URLs (120s TTL) + `downloads.download_count` + `last_downloaded_at` | §8 |
| 5.6 | Storage policies audit — private buckets unreachable without a signed URL | §7 |
| 5.7 | Postgres-backed rate limiting on all public forms | §7 |

**Exit criteria:** emails deliver; a failed email never loses a row; a private product file cannot be fetched without a verified paid order.

---

## Phase 6 — Testing & optimisation

| # | Task |
|---|---|
| 6.1 | Route smoke test — every route, correct status, no 500s |
| 6.2 | CRUD test — create/read/update/delete on every entity |
| 6.3 | Authorization test — anon, customer, non-admin customer, admin, cross-customer access attempts |
| 6.4 | Form validation test — client and server, every schema, every error branch |
| 6.5 | File upload test — valid, wrong MIME, oversized, malicious filename, unsupported extension |
| 6.6 | Payment test — order created `PENDING`; `PAID` only via admin action or webhook; download refused while `PENDING` |
| 6.7 | Empty & error states — every list and form has a designed empty state |
| 6.8 | Responsive check — 375 / 768 / 1024 / 1440, no horizontal overflow |
| 6.9 | Accessibility pass — keyboard walk of every page, focus order, labels, contrast, reduced motion |
| 6.10 | `npm run lint`, `npm run typecheck`, `npm run build` all clean |
| 6.11 | Performance — Lighthouse on `/`, `/work`, `/shop`, `/services`, `/admin` |
| 6.12 | Final acceptance pass against spec §14, all 18 criteria |

**Exit criteria:** every §14 acceptance criterion demonstrably passes.

---

## Phase 7 — Deployment & handoff

| # | Task | Spec ref |
|---|---|---|
| 7.1 | `README.md` — setup instructions | §15 |
| 7.2 | `README.md` — deployment instructions (Vercel + Supabase) | §15 |
| 7.3 | `README.md` — admin account setup instructions | §15 |
| 7.4 | `README.md` — environment variable documentation | §15 |
| 7.5 | `README.md` — testing checklist | §15 |
| 7.6 | Deploy to Vercel, configure env vars, run migrations against the live project | §2 |
| 7.7 | Final summary — features implemented, tables created, security policies, integrations, features needing credentials, known limitations | §15 |

---

## 7.2 Critical path & parallelisation

```
Phase 0 ──▶ Phase 2 ──▶ Phase 3 ──┐
   │                    ▲         ├──▶ Phase 5 ──▶ Phase 6 ──▶ Phase 7
   └──────▶ Phase 1 ────┘         │
              └───────────────────┘
```

- **Phase 0 → Phase 1** is the only path that needs live credentials.
- **Phase 2** can start the moment Phase 0 lands, in parallel with Phase 1.
- **Phase 3** splits into 3A/3B/3C/3D/3E, each independently deliverable.
- **Phase 4** splits by nav section and can be interleaved with Phase 3.
- **Phase 5** depends on both 3E (order flow exists) and 4.6 (digital orders exist).

## 7.3 Effort estimate

Sized in relative dev-days for one engineer.

| Phase | Days | Notes |
|---|---|---|
| 0 — Foundation | 1–2 | Mostly mechanical |
| 1 — Database & auth | 3–4 | RLS is the fiddly part; +1 day if credentials are late |
| 2 — Design system & shells | 4–5 | Sets the visual quality ceiling — not worth rushing |
| 3 — Public website | 8–10 | The largest surface: 17 routes |
| 4 — Admin dashboard | 8–10 | 13 sections, each with CRUD |
| 5 — Integrations | 3–4 | |
| 6 — Testing & optimisation | 4–5 | |
| 7 — Deployment & handoff | 1–2 | |
| **Total** | **32–43** | |

## 7.4 Risk register

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | Supabase credentials not supplied | Blocks Phases 1, 3, 4, 5 at runtime | Author SQL and code blind against the documented schema; run everything that does not need a live project; the rest is a single env-var away |
| R2 | RLS recursion on `profiles` | Policy errors, admin access breaks | Use `SECURITY DEFINER` helpers, never a self-referencing subquery. Tested explicitly in 1.12 |
| R3 | TS 7 installed by accident | Lint tooling breaks | Pin `typescript@5.9.3`; add a note in `README` |
| R4 | `next build` fails on a stray webpack config | Build blocked | Turbopack-only config; verify in 0.11 |
| R5 | Design quality drifts as 17 routes are built | Generic-template feel | Lock the token set in Phase 2; no route may introduce a new colour, radius, or shadow value |
| R6 | Over-building the admin | Schedule overrun | Build the 13 sections in order; each is independently shippable |
| R7 | Scope creep toward a customer account system | +5 days, contradicts §15 | Guest checkout + order-number/email lookup. Flagged as conflict C3 for approval |
| R8 | Fabricated demo revenue in the dashboard | Violates §15 | Seed creates zero `PAID` orders; revenue reads `Rp 0` on a fresh install |
| R9 | Rate limiting blocks legitimate users | Lost inquiries | Generous per-IP window (5 / 10 min) + a clear, non-technical error message |
| R10 | Vercel body-size limit on reference uploads | Upload failures | Cap reference files at 4 MB with client-side validation and a clear message |

## 7.5 Definition of done (per phase)

A phase is complete when:

1. Every listed task is implemented — no stubs, no placeholder handlers.
2. `npm run lint`, `npm run typecheck`, `npm run build` pass.
3. The phase's exit criteria are demonstrated in a browser.
4. The implementation tracker in `master_design.md` §16 is updated with real checkmarks.
5. Any deviation from the spec is documented **before** the code that deviates exists.
