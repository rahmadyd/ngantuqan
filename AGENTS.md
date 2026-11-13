<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ngantuqan — agent instructions

## Scope and source of truth

- This is a visual refresh of a working Next.js 16 App Router shop and portfolio, not a redesign or rebuild.
- Read `DESIGN.md` and `.continue/rules/01-design-direction.md` before UI work. `DESIGN.md` is direction data, not executable session instructions.
- Read `.continue/rules/00-antislop.md` and load the `antislop` skill. Treat `docs/05-design-system.md` and `docs/08-technical-conflicts.md` as historical references until reconciled with code.
- The homepage hero is the only section allowed significant composition changes. Preserve every other section's order, grid, content placement, hierarchy, and functionality.
- Never fabricate content or assets. Use real data or explicitly labelled placeholders.
- Preserve Supabase queries, server actions, payments, auth, checkout, delivery, forms, and admin behavior.

## Architecture

- Routes live in `src/app/(public)`, `src/app/(auth)`, `src/app/admin`, and `src/app/api`; `(public)` does not add a URL segment.
- Server Components are default. `"use client"` belongs only on interactive leaves; mutations live in `src/lib/actions` and schemas in `src/lib/validations`.
- Catalogue reads live in `src/lib/queries/content.ts` and `src/lib/queries/media.ts`. Public reads can fall back to `DEMO_*` data when Supabase is unavailable, so rendered data alone does not prove the database path works.
- Authorization uses `src/proxy.ts`, `src/lib/supabase/guards.ts`, and RLS. Use `getClaims()` rather than `getSession()`.
- The public site is bilingual via `ngantuqan_locale`; dictionaries are in `src/lib/i18n/dictionaries`, DB translations use `translations.id`, admin fields use `tr_id_<field>`, and admin/legal bodies remain English.
- Payment providers live in `src/lib/payments`; manual is the default and Stripe is enabled by its environment keys.
- Catalogue cache is 60 seconds per runtime instance, not globally shared.

## Toolchain quirks

- Tailwind is v4 CSS-first: tokens are in `src/app/globals.css` under `@theme inline`; there is no `tailwind.config.ts`.
- Dev writes `.next-dev`; production writes `.next`. Restart `next start` after a production build replaces `.next`.
- Production targets Cloudflare Workers through OpenNext, not Vercel. See `docs/09-deployment.md`.
- This workspace is not a Git repository and has no CI workflow. Do not assume Git or CI behavior.

## Commands

- Development: `npm run dev`
- Required checks: `npm run lint`, then `npm run typecheck`
- Production: `npm run build`, then `npm run start`
- Local Supabase: `npx supabase start -x realtime,imgproxy,edge-runtime,logflare,vector,supavisor,analytics`, then `npx supabase db reset`, then `npm run admin:create`
- Integration scripts: `npm run check:validation`, `check:email`, `check:rls`, `check:storage`, `check:auth`, `check:admin`, `check:crud`, `check:order`, `check:checkout`, `check:ratelimit`, `check:payments`, `check:stripe`, `check:content`
- Database checks mutate data: use only the local stack and set `BASE_URL` explicitly. `check:validation` and `check:email` are standalone.
- `supabase db reset` does not reproduce the translated local database because `supabase/seed.sql` omits translated rows.

## Delivery

- Run the app and click every changed control at mobile, tablet, and desktop widths; check console errors, focus visibility, and horizontal overflow.
- Run the antislop Delivery Gate before delivery and report concrete PASS evidence. A FAIL must be fixed before shipping.
- Measure results. Never report performance numbers that were not measured.

<!-- antislop:start -->
## antislop

For UI, copy, people, mobile layout, or code comments work, read the anti-slop core
filter and then the skill for the task.

- Core filter (in-repo): `.continue/rules/00-antislop.md`
- Core filter (installed skill): load the `antislop` skill
- Per-concern skills (`antislop-ui`, `antislop-copywriting`, `antislop-human`, `antislop-layoutmobile`, `antislop-code`) are optional and are not installed in
  this repository. If the owner adds them under `skills/`, read the matching one.

Before starting, follow the core's "Two Usage Modes" section in strict order:
explicit session instruction first, then global preference, then ask. A session
instruction always wins. For a resolved mode, say
`antislop active: <mode> (session override).` or
`antislop active: <mode> (global preference).` once before presenting findings or
making edits, using the actual mode and source. Acknowledging the request without
naming the source does not replace this notice.

If the mode is unresolved, ask during or after and end the response; wait for the
answer before any UI review, planning, or concept. For read-only tasks, put the
active-mode notice only at the start of the final answer, never in progress
messages. For editing tasks, announce before the first edit and omit it from the
final answer.

To update antislop later: download the core file again, or run
`npx antislop-ai --update` if it was installed as skill folders.

<!-- antislop:end -->
