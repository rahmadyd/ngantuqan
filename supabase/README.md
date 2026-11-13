# Supabase — local setup

This directory holds the database schema and seed data.

```
supabase/
  migrations/
    0001_extensions_and_enums.sql
    0002_tables.sql
    0003_triggers.sql
    0004_rls_policies.sql
    0005_storage.sql
    0006_functions.sql
  seed.sql
```

## Applying to the local stack

```bash
npx supabase start -x realtime,imgproxy,edge-runtime,logflare,vector,supavisor,analytics
npx supabase db reset
```

`db reset` recreates the database, applies every migration in order, and runs
`seed.sql`. It also wipes the admin account — recreate it afterwards with
`npm run admin:create`.

## Applying to a hosted project

Create the project at [supabase.com/dashboard](https://supabase.com/dashboard),
then link and push:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

`db push` applies any migrations the hosted database has not seen. It does not
run `seed.sql` — apply that by hand in the SQL editor if you want demo content
in production.

Set these in Vercel afterwards:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

## Creating the first administrator

1. **Sign up** in the app at `/admin-login` — this creates an `auth.users` row
   and, through the `handle_new_user` trigger, a `profiles` row with role
   `CUSTOMER`.
2. **Promote** it by running this in the SQL editor:

```sql
UPDATE public.profiles SET role = 'ADMIN' WHERE email = 'you@example.com';
```

3. Sign out and back in. The role is read at sign-in, so a fresh session is
   required.

For the local stack, `npm run admin:create` does all three steps
automatically.

## Storage buckets

Created by migration `0005_storage.sql`:

| Bucket | Visibility | Contents |
|---|---|---|
| `public-media` | public | Portfolio and product preview images, avatars |
| `private-products` | private | Purchasable product files |
| `private-attachments` | private | Client reference files on service orders |

`private-products` has **no direct read policy at all** — not even for admins
through the client. Those files are served exclusively through short-lived
signed URLs (120s) minted server-side by `POST /api/download/[itemId]`, after
verifying that the order is paid and belongs to the caller.

## Regenerating types

After changing the schema:

```bash
npm run gen:types
```

This writes `src/types/database.types.ts` from the live database. The script
writes UTF-8 explicitly — a plain `>` redirect under Windows PowerShell 5.1
produces UTF-16, which ESLint then rejects as a binary file.

## Verifying security

With the local stack running:

```bash
npm run check:rls      # anonymous key must not read private data
npm run check:storage  # private buckets must reject anonymous access
```
