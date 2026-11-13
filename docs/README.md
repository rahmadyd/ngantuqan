# Project Documentation

Planning deliverables for the **ngantuqan** Creative Design Studio & Digital
Marketplace, derived from [`../master_design.md`](../master_design.md) (the
approved source of truth).

> **Status:** Phases 2–7 are built — design system, public website, database
> and auth, the admin dashboard, the project brief, guest checkout, email, a
> Postgres-backed rate limiter, and the payment provider interface. Conflicts
> C3, C6, and C7 are ruled and built; the hosted credentials remain.

## Documents

| # | Document | Contents |
|---|---|---|
| 01 | [Repository Inspection](./01-repository-inspection.md) | Workspace state, toolchain, resolved dependency versions, environment readiness |
| 02 | [Technical Architecture Proposal](./02-technical-architecture.md) | Rendering model, authorization, storage, payments, email, SEO, deployment, quality gates |
| 03 | [Database Relationship Diagram](./03-database-relationship.md) | ER diagram, 20 tables, constraints, 38 indexes, RLS matrix, migration plan |
| 04 | [Public Website Sitemap](./04-public-sitemap.md) | 17 public routes, 15 admin routes, route groups, linking map, indexing rules |
| 05 | [UI/UX Design System](./05-design-system.md) | Brand identity, tokens, contrast audit, type scale, spacing, grid, motion, states, a11y checklist |
| 06 | [Component Hierarchy](./06-component-hierarchy.md) | Full component tree, Server/Client boundary map, anti-patterns |
| 07 | [Development Roadmap](./07-development-roadmap.md) | 8 phases, 100+ tasks, exit criteria, effort estimate, risk register |
| 08 | [Technical Conflicts & Decisions](./08-technical-conflicts.md) | **26 conflicts — 15 need a ruling before coding** |
| 09 | [Deployment](./09-deployment.md) | Cloudflare Workers + Supabase, the free tiers, the limits, the checklist |

## Reading order

1. Start with **08** — it contains the approval checklist that unblocks implementation.
2. **02** for the architectural stance.
3. **03** and **04** for the data and route contracts.
4. **05** and **06** for the build surface.
5. **07** for execution order.

## One-paragraph summary

A Next.js 16 (App Router, React 19, TypeScript 5.9, Tailwind v4) application on Vercel, backed by Supabase Postgres with Row Level Security, Supabase Auth, and Supabase Storage, with Resend for transactional email. The public site covers portfolio, services with a project-brief order flow, and a digital product shop with a guest checkout that produces a `PENDING` digital order, confirmed manually by an admin, with downloads served only through short-lived signed URLs. The admin dashboard manages all 13 specified sections behind three independent authorization layers. The studio — **ngantuqan** — uses the spec's palette as CSS-variable design tokens with a computed WCAG contrast audit that dictates exactly where each accent may be used. The wordmark is typographic (`ngantuqan` in Fredoka 600 with a coral terminal dot) because the repository contains no logo asset; an uploaded image mark replaces it with no code change.

## Verification performed

- Live npm registry lookups for every dependency, including `peerDependencies` compatibility checks.
- Web documentation checks against Next.js 16 upgrade guides, Supabase SSR guidance (current `getClaims()` API), shadcn/ui Tailwind v4 guidance, and the Resend API reference.
- Computed sRGB→OKLCH conversion and WCAG 2.1 contrast ratios for all palette pairings — no ratio was estimated by eye.
