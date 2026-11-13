# 04 — Public Website Sitemap

> Phase 1 deliverable. Route inventory for the public site, the customer-facing order flow, and the admin application.

## 4.1 Public route tree

```
/                                                     Home
│
├── /work                                             Portfolio index
│   └── /work/[slug]                                  Project detail
│
├── /services                                         Services index
│   └── /services/[slug]                              Service detail
│
├── /shop                                             Digital shop
│   └── /shop/[slug]                                  Product detail
│
├── /about                                            About / studio
│
├── /contact                                          Contact + inquiry form
│
├── /order/[service-slug]                             Project brief form
│   └── /order/[service-slug]/submitted               Confirmation page
│
├── /checkout                                         Cart → digital order
│
├── /order-confirmation/[orderNumber]                 Post-purchase summary
│
├── /privacy-policy                                   Legal
├── /terms-and-conditions                              Legal
├── /refund-policy                                    Legal
└── /digital-product-license                          Legal
```

## 4.2 Route specification

| # | Route | Spec ref | Purpose | Data source | Rendering | Metadata |
|---|---|---|---|---|---|---|
| 1 | `/` | §4.A | Studio introduction + conversion | `projects` (featured), `services` (active), `products` (featured), `testimonials` (featured+published), `site_settings` | Static shell + RSC data | Dynamic, OG image |
| 2 | `/work` | §4.B | Portfolio grid, category filter, title search | `projects` (published) + `categories` (PORTFOLIO) | RSC, filter via `searchParams` | Dynamic, canonical, `?page=` paginated |
| 3 | `/work/[slug]` | §4.C | Project case study | `projects` + `project_images` + related projects | RSC, `generateStaticParams` | Dynamic from `seo_title`/`seo_description` |
| 4 | `/services` | §4.D | Service catalogue | `services` (active) + `service_packages` + `categories` (SERVICE) | RSC | Dynamic |
| 5 | `/services/[slug]` | §4.E | Service detail, packages, pricing, FAQ | `services` + `service_packages` | RSC, `generateStaticParams` | Dynamic + FAQPage JSON-LD |
| 6 | `/shop` | §4.F | Product catalogue, search, filter, sort | `products` (published) + `categories` (PRODUCT) | RSC, filter/sort via `searchParams` | Dynamic, `?page=` paginated |
| 7 | `/shop/[slug]` | §4.G | Product detail, previews, license, purchase | `products` + `product_images` | RSC, `generateStaticParams` | Dynamic + Product JSON-LD |
| 8 | `/about` | §4.H | Story, vision, philosophy, capabilities, tools, workflow | `site_settings` (home/about blocks) | RSC | Dynamic |
| 9 | `/contact` | §4.I | Functional inquiry form | Server Action → `inquiries` + Resend | RSC + client form island | Dynamic |
| 10 | `/order/[service-slug]` | §4.J | Detailed project brief | `services` + `service_packages` | RSC + client form island | `noindex` |
| 11 | `/order/[service-slug]/submitted` | §4.J | Order confirmation | `service_orders` by `order_number` | RSC | `noindex`, `no-store` |
| 12 | `/checkout` | §8 | Cart review → create `digital_orders` | Client cart (sessionStorage) + `products` | Client island + Server Action | `noindex` |
| 13 | `/order-confirmation/[orderNumber]` | §8 | Purchase summary + payment instructions | `digital_orders` + `digital_order_items` | RSC | `noindex`, `no-store` |
| 14 | `/privacy-policy` | §4.K | Editable legal content | `site_settings` (`legal.privacy`) | RSC | Dynamic |
| 15 | `/terms-and-conditions` | §4.K | Editable legal content | `site_settings` (`legal.terms`) | RSC | Dynamic |
| 16 | `/refund-policy` | §4.K | Editable legal content | `site_settings` (`legal.refund`) | RSC | Dynamic |
| 17 | `/digital-product-license` | §4.K | Editable legal content | `site_settings` (`legal.license`) | RSC | Dynamic |

### Routes 12 and 13 — rationale and flag

The spec's §4 route list does not include a checkout or a purchase-confirmation route, but §4.G requires a **"Purchase button"** on the product page, §4.F describes a browsable store, §8 defines a purchase→payment→download lifecycle, and §5.F requires the admin to manage digital orders with amounts and purchase dates. A purchase flow cannot complete without a checkout surface and a destination page.

**Decision:** add `/checkout` and `/order-confirmation/[orderNumber]` as **the minimum additional public routes** needed to satisfy §4.G / §5.F / §8 as written. *(See conflict C4.)*

### `/order-confirmation` as the customer download surface

The spec's §8 step 5 says *"Customer receives access to purchased products"*, and §5.F says *"Only allow downloads after verified payment"* with a `downloads` table tracking `download_count`. But §5's admin navigation list contains no customer-facing route, and §4 defines no customer account area.

**Decision:** make `/order-confirmation/[orderNumber]` the customer's permanent access point. It requires `orderNumber` **and** the email address on the order to view; a purchase is therefore retrievable without building a customer-account system. Downloads from that page are gated on `payment_status = 'PAID'` and mint a 120-second signed URL. *(See conflict C3.)*

## 4.3 Admin route tree

```
/admin-login                                          Admin authentication
│
└── /admin                                             ← guarded by proxy.ts + requireAdmin()
    │
    ├── (overview)          /admin                     Dashboard + Recharts analytics
    ├── /admin/portfolio                              Projects CRUD
    │   ├── new                                           Create
    │   └── [id]/edit                                   Edit
    ├── /admin/services                               Services + packages CRUD
    │   ├── new
    │   └── [id]/edit
    ├── /admin/service-orders                         Orders: list, filter, detail
    │   └── [id]                                        Brief, attachments, status, history
    ├── /admin/products                               Products CRUD
    │   ├── new
    │   └── [id]/edit
    ├── /admin/digital-orders                         Digital orders + manual payment confirm
    ├── /admin/customers                              Customer list
    ├── /admin/inquiries                              Messages, read/unread, reply, spam
    ├── /admin/testimonials                           Testimonials CRUD
    ├── /admin/categories                             Categories CRUD (3 types)
    ├── /admin/content                                Homepage + About + legal content
    ├── /admin/media                                  Media library
    └── /admin/settings                               Studio name, logo, tagline, email,
                                                       socials, footer, SEO defaults, theme
```

### Admin route map to spec §5 navigation

| Spec nav item | Route | Spec § |
|---|---|---|
| 1. Overview | `/admin` | §5.A |
| 2. Portfolio | `/admin/portfolio` | §5.B |
| 3. Services | `/admin/services` | §5.C |
| 4. Service Orders | `/admin/service-orders` | §5.D |
| 5. Digital Products | `/admin/products` | §5.E |
| 6. Digital Orders | `/admin/digital-orders` | §5.F |
| 7. Customers | `/admin/customers` | §5 |
| 8. Inquiries / Messages | `/admin/inquiries` | §5.G |
| 9. Testimonials | `/admin/testimonials` | §5.H |
| 10. Categories | `/admin/categories` | §5 |
| 11. Website Content | `/admin/content` | §5.J |
| 12. Media Library | `/admin/media` | §5.I |
| 13. Settings | `/admin/settings` | §5.J |
| — (authentication) | `/admin-login` | §5 |

## 4.4 Route groups

```
src/app/
├── layout.tsx                 ← html/body, fonts, metadataBase, Sonner provider
├── globals.css                ← design tokens, @theme inline, base layer
├── sitemap.ts                 ← dynamic sitemap
├── robots.ts                  ← robots.txt
├── not-found.tsx
├── error.tsx
│
├── (public)/
│   ├── layout.tsx             ← public shell: Header + main + Footer
│   ├── page.tsx               ← /
│   ├── work/page.tsx
│   ├── work/[slug]/page.tsx
│   ├── services/page.tsx
│   ├── services/[slug]/page.tsx
│   ├── shop/page.tsx
│   ├── shop/[slug]/page.tsx
│   ├── about/page.tsx
│   ├── contact/page.tsx
│   ├── order/[service-slug]/page.tsx
│   ├── order/[service-slug]/submitted/page.tsx
│   ├── checkout/page.tsx
│   ├── order-confirmation/[orderNumber]/page.tsx
│   ├── privacy-policy/page.tsx
│   ├── terms-and-conditions/page.tsx
│   ├── refund-policy/page.tsx
│   └── digital-product-license/page.tsx
│
├── (auth)/
│   └── admin-login/page.tsx   ← centred auth card, no public header/footer
│
├── admin/
│   ├── layout.tsx             ← requireAdmin() + sidebar + topbar
│   ├── page.tsx               ← overview
│   ├── portfolio/…
│   ├── services/…
│   ├── service-orders/…
│   ├── products/…
│   ├── digital-orders/…
│   ├── customers/…
│   ├── inquiries/…
│   ├── testimonials/…
│   ├── categories/…
│   ├── content/…
│   ├── media/…
│   └── settings/…
│
└── api/
    ├── admin/media/upload/route.ts        POST   admin upload (images)
    ├── admin/products/[id]/files/route.ts POST   admin product-file upload
    ├── attachments/route.ts               POST   public order reference upload
    ├── download/[itemId]/route.ts         POST   gated signed-URL mint
    ├── payments/webhook/route.ts          POST   provider webhook stub
    └── health/route.ts                    GET    liveness probe
```

Route groups keep `(public)` and `(auth)` off the URL while giving each a distinct layout. `admin` is a real path segment (not a group) so `robots.txt` can block it cleanly and `proxy.ts` can match it precisely.

## 4.5 Internal linking map

| From | To | Purpose |
|---|---|---|
| Header nav | `/`, `/work`, `/services`, `/shop`, `/about`, `/contact` | Primary navigation (§4.A.1) |
| Header CTA "Start a Project" | `/contact` (type = Design service) | Primary conversion |
| Home hero | `/work`, `/contact` | Primary + secondary CTA (§4.A.2) |
| Home Selected Works | `/work/[slug]`, `/work` | Project links + "View All Works" |
| Home Services Overview | `/services/[slug]` | Service cards |
| Home Studio Intro | `/about` | "About Studio" link |
| Home Digital Products | `/shop/[slug]`, `/shop` | Product links |
| Home CTA | `/contact`, `/order/[service-slug]` | "Start a Project" + "Contact" |
| Footer | all public routes + 4 legal pages | Navigation, socials, email |
| Portfolio card | `/work/[slug]` | Detail |
| Portfolio filter | `/work?category=[slug]` | Filter state in URL (shareable, SSR-able) |
| Project detail | `/work/[slug]` (related), `/contact` | "Start a Similar Project" |
| Service card | `/services/[slug]` | Detail |
| Service detail | `/order/[service-slug]` | "Order This Service" |
| Service package buy | `/order/[service-slug]?package=[slug]` | Pre-selects package |
| Order form | `/order/[service-slug]/submitted` | Post-submit redirect |
| Shop card | `/shop/[slug]` | Detail |
| Product detail | `/checkout` | "Purchase" (adds to cart) |
| Checkout | `/order-confirmation/[orderNumber]` | Post-order |
| Order confirmation | `/order-confirmation/[orderNumber]` | Download links (only when PAID) |
| Admin sidebar | all admin routes | §5 navigation |

**No dead links.** Every nav item, button, and card resolves to a real route. Buttons that would perform a non-implemented action (e.g. a live payment) are rendered as the real pending-order flow, never as a no-op.

## 4.6 URL conventions

- Slugs are lowercase kebab-case, generated from the title on save, editable by the admin, and validated for uniqueness.
- `?category=`, `?q=`, `?sort=`, `?page=`, `?featured=` are the only query parameters on public catalogue routes.
- The service slug in `/order/[service-slug]` is the same slug as `/services/[slug]`.
- `orderNumber` format: `SO-YYYYMM-XXXX` (service order) and `DO-YYYYMM-XXXX` (digital order).

## 4.7 Indexing rules

| Route | Index | Rationale |
|---|---|---|
| `/`, `/about`, `/contact`, `/services`, `/shop`, `/work` | ✅ index, `follow` | Primary entry points |
| `/work/[slug]`, `/services/[slug]`, `/shop/[slug]` | ✅ index, `follow` | Content pages |
| `/order/[service-slug]` | ❌ `noindex, follow` | Thin/duplicate content across packages |
| `/order/[service-slug]/submitted` | ❌ `noindex, nofollow` | Transactional |
| `/checkout` | ❌ `noindex, nofollow` | Transactional |
| `/order-confirmation/[orderNumber]` | ❌ `noindex, nofollow` | Transactional + private data |
| `/admin/**`, `/admin-login` | ❌ `noindex, nofollow` + `robots.txt` disallow | Private |
| 4 legal pages | ✅ index, `follow` | Referenced in footer |
