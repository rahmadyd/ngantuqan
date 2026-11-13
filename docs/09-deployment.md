# 09 — Deployment: Cloudflare Workers + Supabase

> The specification names Vercel (§2, §12). The studio runs on **Cloudflare
> Workers** instead — the user owns the account, the Workers free plan covers
> a studio site, and Vercel's Hobby plan is limited to non-commercial use.
> The deviation is recorded in `docs/08` (C26). Nothing in the application
> code knows where it runs: the same Next.js build is used.

---

## 09.1 The shape

```
Browser  ──►  Cloudflare Worker (Next.js 16 on the Workers runtime)
                    │
                    ├──►  Supabase (Postgres + Auth + Storage)   the data
                    └──►  Resend                               the email
```

| Piece | Where it runs | Free tier |
|---|---|---|
| The site and the admin dashboard | One Cloudflare Worker | 100,000 requests/day, 10 ms CPU per request, 3 MiB compressed Worker |
| The database, the auth, the file storage | One Supabase project | 500 MB database, 1 GB storage, 50,000 monthly active users, 5 GB egress |
| Transactional email | Resend | 3,000 emails/month, 100/day |

The Worker is a single bundle: the public site, the admin dashboard, the
Server Actions, and the route handlers. Supabase holds everything else.

---

## 09.2 Supabase — the hosted project

### 1. Create it

- <https://supabase.com/dashboard> → **New project**.
- **Region**: *Southeast Asia (Singapore)* or *Northeast Asia (Tokyo)* — the
  closest to Indonesia. The region cannot be changed later.
- Save the database password somewhere safe; the CLI asks for it when you
  push migrations.

### 2. Link the repository

```bash
npx supabase login
npx supabase link --project-ref <YOUR-PROJECT-REF>
```

### 3. Apply the migrations

```bash
npx supabase db push
```

That applies the eleven migrations in order: the tables, the RLS policies, the
storage buckets and their policies, the business functions, the rate limiter,
and the payment provider functions.

To load the **labelled demo content** as well (every record is prefixed
`DEMO`, and the seed creates zero paid orders):

```bash
npx supabase db push --include-seed
```

Skip `--include-seed` for an empty studio — the content is then entered in the
admin dashboard.

### 4. Collect the keys

Settings → **API**:

| Key | Where it goes |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` — public |
| Publishable key (`sb_publishable_…`) | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — public |
| Secret key (`sb_secret_…`) | `SUPABASE_SECRET_KEY` — **server only** |

The publishable key ships to the browser by design; the secret key must never
leave the Worker.

### 5. Create the admin account

Point `.env.local` at the hosted project (URL + secret key), then:

```bash
npm run admin:create
```

It creates the user, confirms the email, and promotes the profile to `ADMIN`.
Set `ADMIN_PASSWORD` first — the default is a local development password.

### 6. Auth settings

Settings → **Authentication → URL Configuration**:

- **Site URL**: the deployed address (see 09.3).
- **Redirect URLs**: add the same address and `https://<subdomain>.workers.dev/*`.

The site does not use email sign-in for customers, so the confirmation email
only matters for the admin account.

---

## 09.3 Cloudflare Workers — the app

### 1. Account and login

- <https://dash.cloudflare.com/sign-up> — the free plan needs no card.
- Workers → **Create application** → **Hello World** → **Deploy** (this
  proves the account works), then delete it if you like.

```bash
npx wrangler login
```

### 2. The public variables

`wrangler.jsonc` holds the public values. `NEXT_PUBLIC_*` variables are
**inlined into the bundle at build time**, so they must be right in both
places:

```jsonc
"vars": {
  "NEXT_PUBLIC_SITE_URL": "https://ngantuqan.com",
  "NEXT_PUBLIC_SUPABASE_URL": "https://<YOUR-PROJECT-REF>.supabase.co",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": "sb_publishable_…",
  ...
}
```

`NEXT_PUBLIC_SITE_URL` is the canonical address: it drives the metadata, the
canonical links, the sitemap, and `robots.txt`.

For the build, put the same public values in `.env.production.local` (it is
gitignored, and it wins over `.env.local`):

```env
NEXT_PUBLIC_SITE_URL=https://ngantuqan.com
NEXT_PUBLIC_SUPABASE_URL=https://<YOUR-PROJECT-REF>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
```

### 3. The secrets

Server-only values are never in `wrangler.jsonc`. They are set once:

```bash
npx wrangler secret put SUPABASE_SECRET_KEY
npx wrangler secret put ORDER_ACCESS_SECRET
npx wrangler secret put RATE_LIMIT_SECRET
npx wrangler secret put RESEND_API_KEY     # optional — without it, mail is skipped
```

| Secret | What it does |
|---|---|
| `SUPABASE_SECRET_KEY` | Signed download URLs, privileged storage writes, the rate limiter, the provider confirmation |
| `ORDER_ACCESS_SECRET` | Signs the guest order access tokens; falls back to the secret key |
| `RATE_LIMIT_SECRET` | Signs the hashed client address in the rate limit counters |
| `RESEND_API_KEY` | Transactional email — without it every send is skipped and logged |

Generate the two secrets with any random string; `openssl rand -hex 32` is
enough.

### 4. Deploy

```bash
npm run deploy
```

That builds the Next.js app, adapts it with OpenNext, and uploads the Worker.
The address is printed at the end:

```
https://ngantuqan.<your-subdomain>.workers.dev
```

### 5. A custom domain

If the domain's DNS is on Cloudflare: Workers → your Worker → **Settings →
Triggers → Custom Domains** → add the domain. Cloudflare creates the DNS
record and issues the certificate.

If the domain is elsewhere, add a CNAME to the `workers.dev` address.

### 6. Rebuild after changing the address

`NEXT_PUBLIC_SITE_URL` is baked into the bundle, so after the domain is
final: change it in `wrangler.jsonc` **and** `.env.production.local`, then
`npm run deploy` again.

---

## 09.4 Previewing before you deploy

The production build runs on the Workers runtime locally, not on Node:

```bash
npm run preview
```

It serves <http://localhost:8787> through `wrangler dev`, using the variables
in `.dev.vars` (gitignored — it points at the local Supabase stack).

The verification scripts run against it unchanged:

```bash
$env:BASE_URL="http://127.0.0.1:8787"
npm run check:rls      # 14/14
npm run check:admin    # 18/18
npm run check:crud     # 34/34
npm run check:order    # 26/26
npm run check:checkout # 25/25
npm run check:ratelimit # 24/24
npm run check:payments # 19/19
```

One difference to know: on the Workers runtime the client address comes from
`cf-connecting-ip`, which the browser cannot set. Locally, on `next dev`, it
comes from `x-forwarded-for`. The limiter hashes whichever it is given.

---

## 09.5 The checklist after the first deploy

| # | Check | How |
|---|---|---|
| 1 | The home page renders | `GET /` → 200 |
| 2 | The catalogue reads from the hosted database | `/work`, `/services`, `/shop` show the content |
| 3 | The admin login works | `/admin-login` → sign in → `/admin` |
| 4 | The contact form stores a row | Submit it, then check Admin → Inquiries |
| 5 | The email arrives | Submit the form with `RESEND_API_KEY` set |
| 6 | A checkout works | Buy something → the confirmation page shows the order number |
| 7 | The download is gated | The admin marks it paid → the file appears and downloads |
| 8 | The rate limiter is armed | Six contact submissions → the sixth is refused |
| 9 | The callback route refuses a forged call | `POST /api/webhooks/payment/manual` → 400 |
| 10 | The sitemap points at the right domain | `/sitemap.xml` lists the deployed address |

---

## 09.6 Where the free tiers bite

### The image service

The Worker has the `IMAGES` binding, so Cloudflare transforms the images on
the edge: a 100 KB PNG becomes a 1.2 KB WebP at the width the page asked
for. Nothing to configure — the binding is already in `wrangler.jsonc`.

**The free plan allows 5,000 unique transformations a month.** A
transformation is one source image at one size, and the same transformation
served again in the same month is free. Past the allowance, new
transformations fail with error 9422 (they are not charged — the Images Paid
plan is $0.50 per 1,000 above 5,000).

The demo artwork is SVG, which Cloudflare returns unchanged. The uploads —
the studio's own photographs — are what the service is for.

### The Worker size

The Worker must stay under **3 MiB compressed** on the free plan. This build
is **2.43 MiB** — it fits, with roughly 600 KiB of headroom. Every new
dependency goes into that bundle, so watch it:

```bash
npx wrangler deploy --dry-run
```

It prints `Total Upload: … / gzip: …`. If it goes over, either remove a
dependency or move to the Workers Paid plan ($5/month, 10 MiB).

### The CPU limit

The free plan allows **10 ms of CPU per request**. Most of a request is spent
waiting on Supabase, which does not count, but a heavy page (the admin
overview with its charts) can push it over. The symptom is error **1106**,
*"Worker exceeded CPU time limit"*, in the Worker logs.

If that happens: the Workers Paid plan raises the limit to 30 seconds, or the
page can be made lighter. Nothing else has to change.

### Supabase pauses the project

A free project with no activity for seven days is **paused**. The site then
returns an error until it is restored — one click in the Supabase dashboard,
and the restore takes a minute or two. A studio site with occasional traffic
will hit this; a scheduled ping (a cron job hitting the site once a day)
keeps it awake.

### The database and the storage

500 MB of database and 1 GB of storage is plenty for a studio. The storage
holds the product files that customers download — those are the files worth
keeping small, because the storage limit is also the download bandwidth.

---

## 09.7 Updating after the first deploy

```bash
# 1. Apply any new migrations to the hosted database
npx supabase db push

# 2. Rebuild and redeploy
npm run deploy
```

To undo a deployment, Cloudflare keeps the previous version: Workers → your
Worker → **Deployments** → pick one → **Rollback**.

---

## 09.8 What is still not built

- **A live payment provider.** The order stays `PENDING` until the studio
  confirms it. The interface, the registry, and the callback route are ready
  for one.
- **Rate limiting on the download route** is there; rate limiting on the
  admin API is not (it sits behind the session check).
