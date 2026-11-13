-- =============================================================================
-- ngantuqan — seed data
--
-- DEMONSTRATION CONTENT ONLY (master_design.md §15).
-- Every record is prefixed "DEMO" so it is never mistaken for real client
-- work. No PAID orders are created, so revenue reads Rp 0 on a fresh install
-- rather than inventing transactions.
--
-- Images point at the local /public/images/demo/*.svg artwork.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
INSERT INTO public.categories (id, name, slug, type, description) VALUES
  ('11111111-1111-4111-8111-000000000001', 'Social Media Design', 'social-media-design', 'PORTFOLIO', 'Campaign and feed systems built for scroll-stopping brands.'),
  ('11111111-1111-4111-8111-000000000002', 'Branding', 'branding', 'PORTFOLIO', 'Identity work — marks, systems, and guidelines.'),
  ('11111111-1111-4111-8111-000000000003', 'Banner Design', 'banner-design', 'PORTFOLIO', 'Promotional graphics for web and print.'),
  ('11111111-1111-4111-8111-000000000004', 'Presentation', 'presentation', 'PORTFOLIO', 'Pitch decks and keynote systems.'),
  ('11111111-1111-4111-8111-000000000005', 'UI/UX Design', 'ui-ux-design', 'PORTFOLIO', 'Product interfaces and design systems.'),
  ('11111111-1111-4111-8111-000000000006', 'Social Media Templates', 'social-media-templates', 'PRODUCT', 'Ready-to-edit feed and story templates.'),
  ('11111111-1111-4111-8111-000000000007', 'Presentation Templates', 'presentation-templates', 'PRODUCT', 'Slide systems for pitch decks and reports.'),
  ('11111111-1111-4111-8111-000000000008', 'Poster Templates', 'poster-templates', 'PRODUCT', 'Print-ready poster layouts.'),
  ('11111111-1111-4111-8111-000000000009', 'Canva Templates', 'canva-templates', 'PRODUCT', 'Editable templates sized for Canva.'),
  ('11111111-1111-4111-8111-000000000010', 'Design Assets', 'design-assets', 'PRODUCT', 'Icon packs, brushes, and reusable assets.'),
  ('11111111-1111-4111-8111-000000000011', 'Branding & Visual Identity', 'branding-visual-identity', 'SERVICE', 'Logo, palette, type, and usage guidelines.')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
INSERT INTO public.projects (id, title, slug, description, category_id, cover_image, client_name, project_year, is_featured, is_published, seo_title, seo_description) VALUES
  ('22222222-2222-4222-8222-000000000001', 'DEMO — Aurora Coffee Rebrand', 'demo-aurora-coffee-rebrand',
   'A full identity refresh for a specialty roaster. We rebuilt the mark around a rising-sun arc, paired it with a warm terracotta palette, and shipped a 40-page guideline covering packaging, cups, and store signage.',
   '11111111-1111-4111-8111-000000000002', '/images/demo/aurora-cover.svg', 'Aurora Coffee (sample)', 2025, true, true,
   'Aurora Coffee Rebrand — Brand Identity Case Study', 'How we rebuilt a specialty coffee brand identity, from logo through packaging and signage guidelines.'),
  ('22222222-2222-4222-8222-000000000002', 'DEMO — Kiln Ceramics Social Campaign', 'demo-kiln-ceramics-social-campaign',
   'A twelve-week content system for a ceramics studio. We designed a modular grid, a set of 30 editable post frames, and a shoot template so the in-house team could keep publishing without a designer on call.',
   '11111111-1111-4111-8111-000000000001', '/images/demo/kiln-cover.svg', 'Kiln Ceramics (sample)', 2025, true, true,
   'Kiln Ceramics Social Campaign — Content System', 'A modular social media system that let a ceramics studio publish consistently without external design support.'),
  ('22222222-2222-4222-8222-000000000003', 'DEMO — Northwind Pitch Deck', 'demo-northwind-pitch-deck',
   'A 28-slide investor deck for a logistics startup. We built a chart system, a typographic hierarchy that survives projector contrast, and a layout the founding team could extend without breaking the rhythm.',
   '11111111-1111-4111-8111-000000000004', '/images/demo/northwind-cover.svg', 'Northwind (sample)', 2024, true, true,
   'Northwind Pitch Deck — Presentation Design', 'A 28-slide investor deck with a chart system and hierarchy that holds up on a projector.'),
  ('22222222-2222-4222-8222-000000000004', 'DEMO — Verde Market Banner Set', 'demo-verde-market-banner-set',
   'A seasonal campaign banner set for an online grocery: eight responsive banners, one grid, and a colour system that let the marketing team swap seasonal accents without a redesign.',
   '11111111-1111-4111-8111-000000000003', '/images/demo/verde-cover.svg', 'Verde Market (sample)', 2024, false, true,
   'Verde Market Banner Set — Promotional Design', 'Eight responsive promotional banners built on one grid and a swappable accent system.'),
  ('22222222-2222-4222-8222-000000000005', 'DEMO — Lumen Banking App UI', 'demo-lumen-banking-app-ui',
   'A design system and 24 screens for a mobile banking app. We focused on a legible transaction list, a two-tap transfer flow, and a colour language for money states that survives colour-blind simulation.',
   '11111111-1111-4111-8111-000000000005', '/images/demo/lumen-cover.svg', 'Lumen (sample)', 2025, true, true,
   'Lumen Banking App — UI/UX Design', 'A mobile banking design system and 24 screens built around legibility and fast transfer flows.'),
  ('22222222-2222-4222-8222-000000000006', 'DEMO — Halcyon Skincare Launch Kit', 'demo-halcyon-skincare-launch-kit',
   'Launch assets for a skincare line: a key visual, six social frames, and a one-page product sheet. The brief was to feel clinical without feeling cold, so we leaned on generous whitespace and a single coral accent.',
   '11111111-1111-4111-8111-000000000001', '/images/demo/halcyon-cover.svg', 'Halcyon (sample)', 2023, false, true,
   'Halcyon Skincare Launch Kit — Brand Campaign', 'Launch assets for a skincare line — key visual, social frames, and a product sheet.')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Project gallery images
-- ---------------------------------------------------------------------------
INSERT INTO public.project_images (project_id, image_url, alt_text, display_order) VALUES
  ('22222222-2222-4222-8222-000000000001', '/images/demo/aurora-01.svg', 'Aurora Coffee primary logo mark on a cream background', 0),
  ('22222222-2222-4222-8222-000000000001', '/images/demo/aurora-02.svg', 'Aurora Coffee packaging layout with terracotta label', 1),
  ('22222222-2222-4222-8222-000000000001', '/images/demo/aurora-03.svg', 'Aurora Coffee colour palette and typography specimens', 2),
  ('22222222-2222-4222-8222-000000000002', '/images/demo/kiln-01.svg', 'Kiln Ceramics social post grid layout', 0),
  ('22222222-2222-4222-8222-000000000002', '/images/demo/kiln-02.svg', 'Kiln Ceramics story template in mint and coral', 1),
  ('22222222-2222-4222-8222-000000000003', '/images/demo/northwind-01.svg', 'Northwind deck cover slide', 0),
  ('22222222-2222-4222-8222-000000000003', '/images/demo/northwind-02.svg', 'Northwind revenue chart slide', 1),
  ('22222222-2222-4222-8222-000000000004', '/images/demo/verde-01.svg', 'Verde Market banner in mint', 0),
  ('22222222-2222-4222-8222-000000000005', '/images/demo/lumen-01.svg', 'Lumen banking app transaction list screen', 0),
  ('22222222-2222-4222-8222-000000000005', '/images/demo/lumen-02.svg', 'Lumen transfer flow screens', 1),
  ('22222222-2222-4222-8222-000000000006', '/images/demo/halcyon-01.svg', 'Halcyon skincare key visual', 0)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------------
INSERT INTO public.services (id, title, slug, description, cover_image, deliverables, turnaround_days, revision_policy, is_active, category_id) VALUES
  ('33333333-3333-4333-8333-000000000001', 'Social Media Design', 'social-media-design',
   'A feed system you can actually keep up with. We design a modular grid and a set of editable frames so publishing stays consistent without a designer on every post.',
   '/images/demo/service-social.svg',
   '["Feed grid design","Editable post templates","Story and reel cover set","Colour and type guidelines","Caption style guide"]'::jsonb,
   5, '2 revision rounds included', true, '11111111-1111-4111-8111-000000000011'),
  ('33333333-3333-4333-8333-000000000002', 'Banner & Promotional Design', 'banner-promotional-design',
   'Campaign artwork that scales across every placement you need — web heroes, display banners, email headers, and paid social — from a single grid.',
   '/images/demo/service-banner.svg',
   '["Responsive banner set","Source design files","Copy and layout variants","Export guide for each placement","Editable templates"]'::jsonb,
   4, '2 revision rounds included', true, NULL),
  ('33333333-3333-4333-8333-000000000003', 'Branding & Visual Identity', 'branding-visual-identity',
   'A logo is a starting point, not an identity. We build the full system — mark, palette, type, and the written rules that keep it consistent after we leave.',
   '/images/demo/service-branding.svg',
   '["Logo suite with clear-space rules","Colour palette with accessibility values","Typography pairing","Brand guideline document","Business card and stationery set","Social media avatar kit"]'::jsonb,
   14, '3 revision rounds on the mark', true, '11111111-1111-4111-8111-000000000011'),
  ('33333333-3333-4333-8333-000000000004', 'Presentation Design', 'presentation-design',
   'Decks that read well from the back row. We build the slide system first, then populate it — so you can add a section a week before the meeting without breaking anything.',
   '/images/demo/service-presentation.svg',
   '["Slide master and layout system","Chart and data visualisation style","Designed slide content","Icon and image direction","Editable source file"]'::jsonb,
   7, '2 revision rounds on the full deck', true, NULL),
  ('33333333-3333-4333-8333-000000000005', 'UI/UX Design', 'ui-ux-design',
   'Product interfaces designed around the tasks people actually came to do. We start with the flows, then the screens, and hand over a system your developers can build from.',
   '/images/demo/service-uiux.svg',
   '["User flow and wireframes","High-fidelity screen designs","Component library","Responsive specifications","Developer handoff notes"]'::jsonb,
   21, '2 revision rounds per stage', true, NULL)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Service packages
-- ---------------------------------------------------------------------------
INSERT INTO public.service_packages (id, service_id, name, description, price, revision_count, delivery_days, features, is_active) VALUES
  ('44444444-4444-4444-8444-000000000001', '33333333-3333-4333-8333-000000000001', 'Starter', 'A single month of content, designed as a repeatable system.', 450000, 2, 5,
   '["12 post designs","4 story templates","1 revision round per post","Editable source files"]'::jsonb, true),
  ('44444444-4444-4444-8444-000000000002', '33333333-3333-4333-8333-000000000001', 'Growth', 'A quarter of content with a deeper template library and a launch set.', 1250000, 3, 7,
   '["36 post designs","12 story templates","Launch announcement set","2 revision rounds per batch","Editable source files"]'::jsonb, true),
  ('44444444-4444-4444-8444-000000000003', '33333333-3333-4333-8333-000000000001', 'Retainer', 'Ongoing design support with priority turnaround and monthly planning.', 3200000, 4, 3,
   '["Everything in Growth","Monthly content planning call","Priority 3-day turnaround","Unlimited working files"]'::jsonb, true),
  ('44444444-4444-4444-8444-000000000004', '33333333-3333-4333-8333-000000000002', 'Single Campaign', 'One campaign across six placements.', 350000, 2, 4,
   '["6 banner sizes","2 layout variants","2 revision rounds","PNG + JPG exports"]'::jsonb, true),
  ('44444444-4444-4444-8444-000000000005', '33333333-3333-4333-8333-000000000002', 'Multi-Campaign', 'Three campaigns with a shared seasonal system.', 950000, 3, 6,
   '["18 banner sizes","3 seasonal accent sets","3 revision rounds","Editable template library"]'::jsonb, true),
  ('44444444-4444-4444-8444-000000000006', '33333333-3333-4333-8333-000000000003', 'Core', 'The identity essentials, delivered as a practical system.', 2500000, 3, 14,
   '["Primary and secondary mark","Colour and type system","1-page guideline sheet","3 revision rounds"]'::jsonb, true),
  ('44444444-4444-4444-8444-000000000007', '33333333-3333-4333-8333-000000000003', 'Full Identity', 'The complete package with applications and a full guideline document.', 6500000, 4, 21,
   '["Everything in Core","40-page guideline document","Stationery and business card set","Social avatar and cover kit","Packaging application mockups"]'::jsonb, true),
  ('44444444-4444-4444-8444-000000000008', '33333333-3333-4333-8333-000000000004', '15-slide Deck', 'A focused deck for a single narrative.', 1200000, 2, 7,
   '["15 designed slides","2 chart styles","2 revision rounds","Editable source file"]'::jsonb, true),
  ('44444444-4444-4444-8444-000000000009', '33333333-3333-4333-8333-000000000004', '30-slide Deck', 'A full pitch or report with a reusable layout system.', 2200000, 3, 10,
   '["30 designed slides","Full layout system","3 chart styles","3 revision rounds","Editable source file"]'::jsonb, true),
  ('44444444-4444-4444-8444-000000000010', '33333333-3333-4333-8333-000000000005', 'Screen Set', 'A focused set of screens for a single flow.', 4500000, 2, 14,
   '["Up to 8 screens","Wireframes for the flow","Component library","2 revision rounds per stage"]'::jsonb, true),
  ('44444444-4444-4444-8444-000000000011', '33333333-3333-4333-8333-000000000005', 'Product Design', 'End-to-end product design with research support.', 12000000, 3, 30,
   '["Up to 24 screens","User flow and wireframes","Full component library","Responsive specifications","Developer handoff session"]'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
INSERT INTO public.products (id, title, slug, description, category_id, cover_image, price, discount_price, file_format, compatibility, license_terms, includes, is_featured, is_published) VALUES
  ('55555555-5555-4555-8555-000000000001', 'DEMO — Aurora Story Template Kit', 'demo-aurora-story-template-kit',
   'Thirty editable story frames built on a single editorial grid. Change the accent colour once and every frame follows. Includes a highlight cover, quote card, product frame, and a poll layout.',
   '11111111-1111-4111-8111-000000000006', '/images/demo/product-story.svg', 145000, 99000,
   'FIG, Canva, PNG', 'Figma, Canva, Adobe Photoshop',
   'Personal and small-business use for one brand. Redistribution of the source files is not permitted.',
   '["30 editable story frames","Highlight cover","Quote card","Product frame","Poll layout","Figma and Canva source files"]'::jsonb,
   true, true),
  ('55555555-5555-4555-8555-000000000002', 'DEMO — Pitch Deck Template', 'demo-pitch-deck-template',
   'A 40-slide investor deck template with a chart system, a financial table style, and layouts for team, roadmap, traction, and the ask. Fully editable.',
   '11111111-1111-4111-8111-000000000007', '/images/demo/product-deck.svg', 275000, NULL,
   'FIG, PPTX, KEY', 'Figma, PowerPoint, Keynote, Google Slides',
   'Personal and commercial use for one brand. Reselling the template as-is is not permitted.',
   '["40 slide layouts","Chart system","Financial table style","Team and roadmap layouts","Editable source file"]'::jsonb,
   true, true),
  ('55555555-5555-4555-8555-000000000003', 'DEMO — Poster Set: Bold Type', 'demo-poster-set-bold-type',
   'Twelve A3 and A2 poster layouts built around expressive typography. Two-column grid, oversized numerals, and a colour system with print-safe CMYK values.',
   '11111111-1111-4111-8111-000000000008', '/images/demo/product-poster.svg', 195000, NULL,
   'AI, PSD, PDF', 'Adobe Illustrator, Adobe Photoshop, InDesign',
   'Commercial print and digital use for one brand. Redistribution of source files is not permitted.',
   '["12 poster layouts","Two-column grid","Oversized numerals","Print-safe CMYK values"]'::jsonb,
   false, true),
  ('55555555-5555-4555-8555-000000000004', 'DEMO — Canva Starter Bundle', 'demo-canva-starter-bundle',
   'Forty-two Canva-sized layouts for social posts, stories, and pins. Set the brand palette once and every template picks it up.',
   '11111111-1111-4111-8111-000000000009', '/images/demo/product-canva.svg', 89000, 59000,
   'Canva, PNG, PDF', 'Canva (free and pro tiers)',
   'Personal and small-business use for one brand. Template resale is not permitted.',
   '["42 Canva layouts","Post, story and pin sizes","Brand palette presets"]'::jsonb,
   true, true),
  ('55555555-5555-4555-8555-000000000005', 'DEMO — Soft Geometry Icon Pack', 'demo-soft-geometry-icon-pack',
   'One hundred and twenty icons drawn on a 2px grid with rounded caps. Ships as SVG, Figma components, and a PNG set for pitch decks.',
   '11111111-1111-4111-8111-000000000010', '/images/demo/product-icons.svg', 165000, NULL,
   'SVG, FIG, PNG', 'Figma, Adobe Illustrator, Sketch, any vector editor',
   'Unlimited project use for one brand. Icon resale as a standalone pack is not permitted.',
   '["120 icons","2px grid with rounded caps","SVG and Figma components","PNG set"]'::jsonb,
   false, true),
  ('55555555-5555-4555-8555-000000000006', 'DEMO — Mini Brand Kit', 'demo-mini-brand-kit',
   'A compact brand kit for a new venture: a logo grid, colour swatches, type pairing, and ten social templates. A sensible start before a full identity.',
   '11111111-1111-4111-8111-000000000006', '/images/demo/product-brandkit.svg', 350000, 249000,
   'FIG, Canva, PDF', 'Figma, Canva, Adobe Photoshop',
   'Personal and commercial use for one brand. Redistribution of source files is not permitted.',
   '["Logo grid","Colour swatches","Type pairing","10 social templates"]'::jsonb,
   false, true)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Product preview images (no product_files rows — nothing is downloadable
-- in demo state, so no file path is ever exposed).
-- ---------------------------------------------------------------------------
INSERT INTO public.product_images (product_id, image_url, alt_text, display_order) VALUES
  ('55555555-5555-4555-8555-000000000001', '/images/demo/product-story-01.svg', 'Aurora story kit cover frame', 0),
  ('55555555-5555-4555-8555-000000000001', '/images/demo/product-story-02.svg', 'Aurora story kit quote card', 1),
  ('55555555-5555-4555-8555-000000000002', '/images/demo/product-deck-01.svg', 'Pitch deck template cover slide', 0),
  ('55555555-5555-4555-8555-000000000003', '/images/demo/product-poster-01.svg', 'Bold Type poster layout', 0),
  ('55555555-5555-4555-8555-000000000004', '/images/demo/product-canva-01.svg', 'Canva bundle layout preview', 0),
  ('55555555-5555-4555-8555-000000000005', '/images/demo/product-icons-01.svg', 'Soft Geometry icon sheet preview', 0),
  ('55555555-5555-4555-8555-000000000006', '/images/demo/product-brandkit-01.svg', 'Mini brand kit preview', 0)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Testimonials — clearly fictional sample copy
-- ---------------------------------------------------------------------------
INSERT INTO public.testimonials (id, customer_name, customer_role, content, project_id, is_featured, is_published) VALUES
  ('66666666-6666-4666-8666-000000000001', 'DEMO Sample Client', 'DEMO — Brand owner',
   'The brief was clear, the questions were sharper than ours, and the delivery came two days early. The guideline document is the part we actually use every week.',
   '22222222-2222-4222-8222-000000000001', true, true),
  ('66666666-6666-4666-8666-000000000002', 'DEMO Sample Client', 'DEMO — Marketing lead',
   'We went from a blank page every Monday to a system the team runs itself. The templates are the work — everything else was just setup.',
   '22222222-2222-4222-8222-000000000002', true, true),
  ('66666666-6666-4666-8666-000000000003', 'DEMO Sample Client', 'DEMO — Founder',
   'Our deck used to be rebuilt from scratch for every meeting. Now we add slides to the master and it still looks like one document.',
   '22222222-2222-4222-8222-000000000003', true, true),
  ('66666666-6666-4666-8666-000000000004', 'DEMO Sample Client', 'DEMO — Product lead',
   'The transfer flow went from five screens to two, and support tickets about it dropped. That is the whole review.',
   '22222222-2222-4222-8222-000000000005', false, true)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Site settings
-- ---------------------------------------------------------------------------
INSERT INTO public.site_settings (setting_key, setting_value, is_public) VALUES
  ('studio', '{"name":"ngantuqan","tagline":"Creative Design Studio & Digital Marketplace","email":"hello@ngantuqan.studio","logoUrl":null,"footerNote":"An independent design studio building brand identities, content systems, and design tools."}'::jsonb, true),
  ('studio.socials', '{"items":[{"platform":"Instagram","url":"https://instagram.com/ngantuqan"},{"platform":"Behance","url":"https://behance.net/ngantuqan"},{"platform":"LinkedIn","url":"https://linkedin.com/company/ngantuqan"}]}'::jsonb, true),
  ('home.hero', '{"eyebrow":"Independent creative design studio","headline":"Design that feels like you.","subheadline":"We build brand identities, content systems, and product interfaces for studios and small teams — then hand over the tools to keep them running without us."}'::jsonb, true),
  ('legal.privacy', '{"title":"Privacy Policy","updatedAt":"2026-01-01"}'::jsonb, true),
  ('legal.terms', '{"title":"Terms & Conditions","updatedAt":"2026-01-01"}'::jsonb, true),
  ('legal.refund', '{"title":"Refund Policy","updatedAt":"2026-01-01"}'::jsonb, true),
  ('legal.license', '{"title":"Digital Product Licence","updatedAt":"2026-01-01"}'::jsonb, true),
  ('seo.defaults', '{"title":"ngantuqan — Creative Design Studio","description":"ngantuqan is an independent creative design studio offering brand identity, social media, presentation, banner, and UI/UX design services — plus downloadable design templates."}'::jsonb, true)
ON CONFLICT (setting_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- No orders, no inquiries, no activity logs. A fresh install reads Rp 0.
-- ---------------------------------------------------------------------------
