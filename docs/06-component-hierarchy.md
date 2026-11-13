# 06 — Component Hierarchy

> Phase 1 deliverable. The component tree the implementation will build, organised by layer.

## 6.1 Layering rules

| Layer | Directory | Rendering | Rule |
|---|---|---|---|
| **UI primitives** | `src/components/ui/` | Client where the primitive requires it | shadcn/ui, vendored into the repo. No business logic, no data access, no site-specific copy |
| **Layout** | `src/components/layout/` | Server by default | Page shells, header, footer, nav, admin chrome |
| **Feature** | `src/components/<domain>/` | Server by default; client only for interactive leaves | Domain components. Read data via props or a server-side query module — **never** fetch from the client |
| **Forms** | `src/components/forms/` | Client | React Hook Form + Zod. Presentational only; the Server Action is passed in as a prop or imported from `lib/actions` |
| **Admin** | `src/components/admin/` | Mixed | Admin-only composites built on the same primitives |

**Data rule:** Server Components query Supabase and pass plain serialisable props down. A Client Component never receives a Supabase client, a service-role key, or a database row containing internal columns.

## 6.2 Full tree

```
src/
│
├── app/                                   ── routes (see 04-public-sitemap.md)
│
├── components/
│   │
│   ├── ui/                                ── shadcn/ui primitives (vendored)
│   │   ├── button.tsx                     variant: primary | secondary | coral | mint | ghost | outline | danger
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx                     native select styled (lighter than radix)
│   │   ├── checkbox.tsx
│   │   ├── radio-group.tsx
│   │   ├── switch.tsx
│   │   ├── tabs.tsx
│   │   ├── accordion.tsx                  FAQ / deliverables
│   │   ├── dialog.tsx                     destructive confirmation
│   │   ├── sheet.tsx                      mobile nav panel
│   │   ├── dropdown-menu.tsx              row actions
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   ├── table.tsx
│   │   ├── sonner.tsx                     toast host
│   │   ├── tooltip.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── alert.tsx
│   │   └── empty-state.tsx                ← custom, not shadcn
│   │
│   ├── layout/
│   │   ├── site-header.tsx                [Server] sticky bar, logo, nav, CTA
│   │   ├── site-nav.tsx                   [Server] desktop links + active state
│   │   ├── mobile-nav.tsx                 [Client] sheet panel, focus trap
│   │   ├── site-footer.tsx                [Server] info, links, socials, email
│   │   ├── logo.tsx                       [Server] wordmark "ngantuqan." + optional image mark
│   │   ├── container.tsx                  [Server] max-width + padding wrapper
│   │   ├── section.tsx                    [Server] section rhythm + optional eyebrow
│   │   ├── section-heading.tsx            [Server] eyebrow + display-md title + lede
│   │   ├── page-hero.tsx                  [Server] asymmetric title block
│   │   ├── cta-panel.tsx                  [Server] dark CTA band
│   │   ├── admin-shell.tsx                [Client] sidebar state + collapse
│   │   ├── admin-sidebar.tsx              [Server] nav from role
│   │   ├── admin-topbar.tsx               [Client] user menu, logout, page title
│   │   └── skip-link.tsx                  [Server]
│   │
│   ├── home/
│   │   ├── hero-section.tsx               [Server]
│   │   ├── hero-visual.tsx                [Server] decorative composition + blobs
│   │   ├── selected-works.tsx             [Server] featured projects
│   │   ├── services-overview.tsx          [Server] accent-cycling service cards
│   │   ├── studio-intro.tsx               [Server] brand story block
│   │   ├── products-preview.tsx           [Server] featured products + prices
│   │   ├── why-work-with-us.tsx           [Server] 4 benefits
│   │   ├── testimonials.tsx               [Server] published testimonials
│   │   └── home-cta.tsx                   [Server]
│   │
│   ├── portfolio/
│   │   ├── project-grid.tsx               [Server] responsive grid
│   │   ├── project-card.tsx               [Server]
│   │   ├── project-filters.tsx            [Client] category + search, syncs URL
│   │   ├── featured-project.tsx           [Server] large editorial card
│   │   ├── project-gallery.tsx            [Server] ordered images
│   │   ├── project-meta.tsx               [Server] category, year, client
│   │   └── related-projects.tsx           [Server]
│   │
│   ├── services/
│   │   ├── service-grid.tsx               [Server]
│   │   ├── service-card.tsx               [Server] accent-coloured
│   │   ├── service-packages.tsx           [Server] package + price table
│   │   ├── package-card.tsx               [Server]
│   │   ├── service-faq.tsx                [Server] accordion
│   │   ├── service-includes.tsx           [Server] deliverables + benefits
│   │   └── order-service-cta.tsx          [Server]
│   │
│   ├── shop/
│   │   ├── product-grid.tsx               [Server]
│   │   ├── product-card.tsx               [Server]
│   │   ├── product-price.tsx              [Server] price + discount badge
│   │   ├── product-gallery.tsx            [Server] preview images
│   │   ├── product-filters.tsx            [Client] category + search + sort
│   │   ├── product-specs.tsx              [Server] format, compatibility, license
│   │   ├── add-to-cart-button.tsx         [Client] sessionStorage cart
│   │   ├── cart-line-item.tsx             [Client]
│   │   ├── cart-summary.tsx               [Client]
│   │   └── purchase-status.tsx            [Server] paid/pending state + download links
│   │
│   ├── about/
│   │   ├── brand-story.tsx                [Server]
│   │   ├── vision-mission.tsx             [Server]
│   │   ├── philosophy.tsx                 [Server]
│   │   ├── capabilities.tsx               [Server] skills list
│   │   ├── tools-marquee.tsx              [Server] design tools
│   │   └── workflow-steps.tsx             [Server] studio process
│   │
│   ├── forms/
│   │   ├── contact-form.tsx               [Client] RHF + zod
│   │   ├── service-order-form.tsx         [Client] RHF + zod + file upload
│   │   ├── checkout-form.tsx              [Client] RHF + zod
│   │   ├── admin-login-form.tsx           [Client] RHF + zod
│   │   ├── form-field.tsx                 [Server-safe] label + control + error + hint
│   │   ├── form-message.tsx               [Client] success/error alert
│   │   ├── file-input.tsx                 [Client] drag/drop + type/size validation
│   │   ├── submit-button.tsx              [Client] pending spinner state
│   │   └── order-summary-form.tsx         [Client] read-only order recap
│   │
│   ├── common/
│   │   ├── price.tsx                      [Server] currency formatter
│   │   ├── status-badge.tsx               [Server] order/payment/product status
│   │   ├── category-chip.tsx              [Server]
│   │   ├── pagination.tsx                 [Server] page links
│   │   ├── search-input.tsx               [Client] debounced, URL-bound
│   │   ├── sort-select.tsx                [Client]
│   │   ├── share-buttons.tsx              [Client] copy link + native share
│   │   ├── legal-content.tsx              [Server] renders site_settings legal body
│   │   └── demo-badge.tsx                 [Server] "DEMO" marker on seeded content
│   │
│   ├── motion/
│   │   ├── reveal.tsx                     [Client] scroll-in wrapper
│   │   ├── stagger.tsx                    [Client] staggered children
│   │   └── motion-provider.tsx            [Client] reduced-motion context
│   │
│   └── admin/
│       ├── stat-card.tsx                  [Server] metric tile
│       ├── stats-grid.tsx                 [Server]
│       ├── revenue-chart.tsx              [Client] Recharts area chart
│       ├── orders-chart.tsx               [Client] Recharts bar chart
│       ├── activity-feed.tsx              [Server] activity_logs list
│       ├── recent-inquiries.tsx           [Server]
│       ├── recent-orders.tsx              [Server]
│       ├── data-table.tsx                 [Client] generic sortable/paginated table
│       ├── table-pagination.tsx           [Client]
│       ├── filter-bar.tsx                 [Client] search + status filters
│       ├── bulk-actions.tsx               [Client] select + action bar
│       ├── entity-form.tsx                [Client] generic form wrapper
│       ├── media-picker.tsx               [Client] browse + insert asset
│       ├── media-uploader.tsx             [Client] drag/drop → API
│       ├── media-grid.tsx                 [Server] library grid
│       ├── image-uploader.tsx             [Client] single image + alt text
│       ├── file-uploader.tsx              [Client] product files list
│       ├── order-status-timeline.tsx      [Server] order_status_history
│       ├── order-brief.tsx                [Server] customer brief fields
│       ├── attachment-list.tsx            [Server] signed download links
│       ├── quote-editor.tsx               [Client] quoted price + notes
│       ├── payment-confirm-dialog.tsx     [Client] manual PAID confirmation
│       ├── jsonb-editor.tsx               [Client] deliverables/features array editor
│       ├── status-select.tsx              [Client]
│       ├── publish-toggle.tsx             [Client]
│       ├── feature-toggle.tsx             [Client]
│       ├── confirm-dialog.tsx             [Client] destructive confirm
│       ├── content-editor.tsx             [Client] homepage/about block editor
│       ├── settings-form.tsx              [Client]
│       ├── image-list-editor.tsx          [Client] reorderable gallery
│       └── media/
│           └── media-detail.tsx           [Server] file metadata panel
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     [Client] createBrowserClient
│   │   ├── server.ts                     [Server] createServerClient (cookie adapter)
│   │   ├── admin.ts                      [Server] service-role client (server-only)
│   │   ├── middleware.ts                 [Server] proxy session refresh helper
│   │   └── guards.ts                     [Server] requireAdmin / requireCustomer / getUser
│   ├── queries/                          [Server] read layer, narrow projections
│   │   ├── projects.ts
│   │   ├── services.ts
│   │   ├── products.ts
│   │   ├── testimonials.ts
│   │   ├── inquiries.ts
│   │   ├── service-orders.ts
│   │   ├── digital-orders.ts
│   │   ├── customers.ts
│   │   ├── media.ts
│   │   ├── settings.ts
│   │   └── activity.ts
│   ├── actions/                          [Server] one file per domain
│   │   ├── auth.ts
│   │   ├── inquiries.ts
│   │   ├── service-orders.ts
│   │   ├── digital-orders.ts
│   │   ├── projects.ts
│   │   ├── services.ts
│   │   ├── products.ts
│   │   ├── testimonials.ts
│   │   ├── categories.ts
│   │   ├── media.ts
│   │   ├── settings.ts
│   │   └── payments.ts
│   ├── validations/                      [Server+Client] Zod schemas, shared
│   │   ├── common.ts                     email, slug, uuid, pagination
│   │   ├── contact.ts
│   │   ├── service-order.ts
│   │   ├── checkout.ts
│   │   ├── project.ts
│   │   ├── service.ts
│   │   ├── product.ts
│   │   ├── testimonial.ts
│   │   ├── category.ts
│   │   ├── inquiry.ts
│   │   ├── settings.ts
│   │   └── login.ts
│   ├── email/
│   │   ├── client.ts                     Resend wrapper, graceful failure
│   │   ├── templates/
│   │   │   ├── layout.ts                 branded shell (header, footer, styles)
│   │   │   ├── inquiry-received.ts        → studio
│   │   │   ├── inquiry-confirmation.ts    → customer
│   │   │   ├── service-order-received.ts  → studio
│   │   │   ├── digital-order-received.ts  → studio
│   │   │   ├── payment-confirmed.ts       → customer
│   │   │   └── order-status-updated.ts    → customer
│   │   └── send.ts                       dispatch + error handling
│   ├── payments/
│   │   ├── types.ts                      PaymentProvider interface
│   │   ├── manual.ts                     ManualProvider
│   │   └── index.ts                      provider registry
│   ├── storage/
│   │   ├── buckets.ts                    bucket names + public path builder
│   │   ├── upload.ts                     validated upload helpers
│   │   └── signed.ts                     short-lived signed URL minting
│   ├── rate-limit.ts                     Postgres-backed limiter
│   └── utils.ts                          cn(), formatCurrency(), formatDate(), slugify()
│
├── hooks/
│   ├── use-media-query.ts
│   ├── use-cart.ts                       sessionStorage cart
│   ├── use-form-status.ts                pending state for Server Actions
│   └── use-debounce.ts
│
└── types/
    ├── database.types.ts                 generated from Supabase
    ├── models.ts                         domain models (Project, Service, Product…)
    └── enums.ts                          shared enum unions
```

## 6.3 Composition examples

### Home page

```
<HomePage>                              [Server]
├─ <Section> <SectionHeading eyebrow="Selected Work" title="…" />
├─ <SelectedWorks>
│  └─ <ProjectCard> × 4                 [Server] cover, category chip, title, "View Project →"
├─ <ServicesOverview>
│  └─ <ServiceCard accent={secondary|mint|coral|primary|mint}>
├─ <ProductsPreview>
│  └─ <ProductCard>                     [Server] image, title, <Price>, "View Product →"
├─ <Testimonials>                       [Server] quote, name, project type
└─ <CtaPanel>                           [Server] headline + <Button asChild><Link>
```

### Service detail

```
<ServiceDetailPage>                     [Server]
├─ <PageHero>                           [Server] title, description, eyebrow
├─ <ServiceIncludes>                    [Server] deliverables[], benefits[]
├─ <ServicePackages>                    [Server]
│  └─ <PackageCard>                     [Server] name, features[], revision, delivery, price
├─ <ServiceFaq>                         [Server] <Accordion> items
└─ <OrderServiceCta>                    [Server] → /order/[slug]?package=[slug]
```

### Admin product edit

```
<AdminProductEditPage>                  [Server]
├─ <AdminShell>
│  ├─ <AdminSidebar>                    [Server]
│  └─ <EntityForm>
│     ├─ <Input name="title" />
│     ├─ <Input name="slug" />
│     ├─ <ImageUploader>                [Client] upload + alt text
│     ├─ <ImageListEditor>              [Client] reorderable gallery
│     ├─ <FileUploader>                 [Client] private product files
│     ├─ <Select name="categoryId" />
│     ├─ <Input name="price" type="number" />
│     ├─ <Input name="discountPrice" type="number" />
│     ├─ <Switch name="isFeatured" />
│     ├─ <Switch name="isPublished" />
│     └─ <SubmitButton>                 [Client] pending state
```

## 6.4 Server / Client boundary map

| Client component | Why it must be client | Server counterpart |
|---|---|---|
| `mobile-nav.tsx` | Sheet open/close, focus trap | `site-nav.tsx` renders the links |
| `project-filters.tsx` | Live filter + URL push | The grid re-renders from `searchParams` |
| `search-input.tsx` | Debounce, keyboard nav | Results come from the RSC page |
| `add-to-cart-button.tsx` | sessionStorage cart state | `cart-summary.tsx` recomputes totals from server prices |
| `contact-form.tsx` | RHF state, validation, pending | Server Action in `lib/actions/inquiries.ts` |
| `service-order-form.tsx` | Multi-step + file upload | Action in `lib/actions/service-orders.ts` |
| `checkout-form.tsx` | Cart editing | Action in `lib/actions/digital-orders.ts` |
| `admin-login-form.tsx` | RHF + pending | `lib/actions/auth.ts` |
| `revenue-chart.tsx` | Recharts needs the DOM | Data fetched server-side, passed as props |
| `data-table.tsx` | Sorting, selection, pagination | Rows fetched server-side via `searchParams` |
| `confirm-dialog.tsx` | Dialog state | The destructive action is a Server Action |
| `status-select.tsx` | Select + pending | Action in the matching domain file |
| `payment-confirm-dialog.tsx` | Dialog + typed confirmation | `lib/actions/digital-orders.ts` |

**Rule:** a Client Component that mutates data imports its Server Action directly and calls it — the action is not passed through props from a Server Component unless it needs closure values.

## 6.5 Anti-patterns explicitly avoided

| Anti-pattern | Rule |
|---|---|
| `page.tsx` containing business logic | Page = layout + composition. Queries live in `lib/queries`, mutations in `lib/actions` |
| Fetching from a Client Component | Server Components fetch; clients receive serialisable props |
| `select('*')` | Every query names its columns |
| Passing the Supabase client to a client component | Forbidden — clients use `lib/supabase/client.ts` only for auth |
| Business rules inside `components/ui/` | Primitives stay generic |
| Duplicated form logic | Shared `form-field.tsx` + shared Zod schemas |
| Client-side zod validation only | Every form validates server-side too (§7) |
| Placeholder-as-label | Labels are always rendered |
| Magic colour values in JSX | Only semantic tokens (`bg-primary`, `text-muted-foreground`) |
