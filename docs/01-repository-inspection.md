# 01 — Repository Inspection

> Phase 1 deliverable. Read-only analysis of the workspace prior to any implementation.

## Summary

| Attribute | Finding |
|---|---|
| Workspace root | `F:\webproject\ngantuqan` |
| Git repository | **No** — `git status` returns `fatal: not a git repository` |
| Existing source files | **None** |
| Existing dependencies | **None** — no `package.json`, no lockfile, no `node_modules` |
| Toolchain present | `node v22.18.0`, `npm 10.9.3`, `npx 10.9.3` |
| Files found | `master_design.md` (24,927 bytes, 1,303 lines) — the approved specification |

## What exists

Exactly one file: `master_design.md`.

```text
F:\webproject\ngantuqan
└── master_design.md      24,927 bytes
```

No hidden configuration, no CI, no `.gitignore`, no `.env*`, no editor settings.

## Interpretation of "do not unnecessarily replace the existing project setup"

There is no existing setup to preserve. The working tree is a greenfield directory containing the specification. Therefore:

- The project is **initialized from scratch** (per §1 of the spec: *"If the repository is empty, initialize the project"*).
- `master_design.md` is treated as **read-only reference** and is never modified by the implementation. All new artefacts are additive.
- The spec's own tracker line *"Inspect repository (empty, not a git repo)"* is **slightly inaccurate** — the directory is not empty, it contains the spec itself. This correction is recorded here so the tracker stays honest.

## Recommended pre-implementation actions (require approval)

| # | Action | Rationale |
|---|---|---|
| A1 | `git init` + create `.gitignore` + initial commit of `master_design.md` | Enables the phased diff-review the spec's workflow implies; gives rollback during a large build. Spec §13/§15 expect iterative, reviewable work. |
| A2 | Scaffold with `create-next-app@16.4.6` (TypeScript, Tailwind, App Router, `src/`, `@/*` alias) | Matches spec §12 `src/` layout and §2 stack exactly. `create-next-app` is the canonical, non-custom setup for Next 16 + Tailwind v4. |
| A3 | Add `.env.example` with **no real secrets** | Explicitly required by spec §15. |
| A4 | Add `supabase/migrations/*.sql` + `supabase/seed.sql` | Explicitly required by spec §15 and §12. |
| A5 | Do **not** install the Supabase local CLI / Docker stack | Deployment target is hosted Supabase + Vercel (spec §2). The CLI is only needed for `supabase start` local emulation, which adds a large prerequisite with no requirement behind it. SQL migrations are authored to be applied through the hosted SQL editor or `supabase db push` with the CLI installed globally on demand. |

## Environment readiness for the target stack

| Requirement | Spec source | Local status | Verdict |
|---|---|---|---|
| Node.js ≥ 20.9 | Next.js 16 engine requirement | `v22.18.0` | ✅ |
| npm ≥ 10 | create-next-app 16 | `10.9.3` | ✅ |
| Git | recommended (not mandated) | absent | ⚠️ needs `git init` |
| Supabase project | §2 | not provisioned | ⛔ user credential required |
| Resend API key + domain | §2, §9 | not provisioned | ⛔ user credential required |

## Toolchain version resolution (checked against the live npm registry)

Resolved on the assumption *"use the latest compatible stable versions"* (§2). Compatibility was verified against actual `peerDependencies` metadata, not assumed.

| Package | Selected | Registry `latest` | Note |
|---|---|---|---|
| `next` | 16.4.6 | 16.4.6 | ✅ matches |
| `react` / `react-dom` | 19.3.1 | 19.3.1 | ✅ matches |
| `typescript` | **5.9.3** | 7.0.2 | ⚠️ **pinned down — see conflict C1** |
| `tailwindcss` | 4.3.5 | 4.3.5 | ✅ matches |
| `@tailwindcss/postcss` | 4.3.5 | 4.3.5 | ✅ matches |
| `tw-animate-css` | 1.4.0 | 1.4.0 | ✅ replaces `tailwindcss-animate` (v4-incompatible) |
| `@supabase/supabase-js` | 2.119.0 | 2.119.0 | ✅ matches |
| `@supabase/ssr` | 0.12.7 | 0.12.7 | ✅ matches |
| `resend` | 6.38.0 | 6.38.0 | ✅ matches |
| `recharts` | 3.10.1 | 3.10.1 | ✅ React 19 compatible |
| `motion` | 14.12.0 | 14.12.0 | ✅ successor of `framer-motion`; imported from `motion/react` |
| `zod` | 4.6.7 | 4.6.7 | ✅ v4 |
| `react-hook-form` | 7.91.0 | 7.91.0 | ✅ |
| `@hookform/resolvers` | 7.0.5 | 7.0.5 | ✅ peer `zod ^3.25 \|\| ^4` — satisfied by zod 4 |
| `lucide-react` | 1.72.0 | 1.72.0 | ✅ |
| `sonner` | 2.0.8 | 2.0.8 | ✅ replaces shadcn's deprecated `toast` |
| `eslint` | 10.14.0 | 10.14.0 | ✅ satisfies `eslint-config-next` peer `>=9` |
| `eslint-config-next` | 16.4.6 | 16.4.6 | ✅ matches Next |
| `@types/node` | **^22** | 26.6.6 | ⚠️ pinned to match the installed Node 22 runtime (see C2) |
| `@types/react` / `@types/react-dom` | 19.3.0 | 19.3.0 | ✅ matches React 19.3.1 |

## Existing functionality to preserve

**None.** There is no code, no configuration, and no runtime behaviour in the workspace. The preservation constraint in spec §1 is therefore vacuously satisfied — but it is restated as a standing rule: nothing in `master_design.md` is edited, and no scaffolded file is replaced by hand-written code without reason.

## Risks carried into Phase 2

1. **TypeScript major-version conflict** — `typescript@latest` is now 7.0.2 (the native `tsgo` compiler), but `typescript-eslint@8.72.2` (pulled in by `eslint-config-next@16.4.6`) declares `peerDependencies.typescript: ">=4.8.4 <6.1.0"`. Installing TS 7 breaks lint. Resolution in C1.
2. **`next lint` was removed in Next 16** — lint must be invoked as `eslint .` directly, and `next build` no longer lints. CI must run lint as its own step.
3. **`middleware.ts` is deprecated in Next 16** — renamed to `proxy.ts`, Node.js runtime only (Edge is not supported there). Supabase session refresh must live in `src/proxy.ts`.
4. **Turbopack is the default bundler for both `next dev` and `next build`** — any `webpack` config in `next.config.ts` makes the build fail outright. No webpack-loader dependencies are planned.
5. **`tailwind.config.js` does not exist in Tailwind v4** — shadcn/ui's `components.json` must ship `"tailwind": { "config": "" }`, and animation utilities come from `tw-animate-css`, not `tailwindcss-animate`.

Detailed mitigations for every item above are in [`08-technical-conflicts.md`](./08-technical-conflicts.md).
