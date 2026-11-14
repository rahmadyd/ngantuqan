# ngantuqan

A creative studio portfolio and digital marketplace for design services and downloadable products.

## Features

- Portfolio for published creative projects
- Service catalogue with project brief ordering
- Digital product shop with protected downloads
- Guest checkout and order confirmation
- Admin dashboard for content, products, orders, customers, and inquiries
- Media library for managing uploaded assets
- Transactional email templates and rate limiting
- Bilingual public content

## Stack

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- Supabase for database, authentication, and file storage
- Resend for transactional email
- Zod and React Hook Form for validation and forms

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill in the required values in `.env.local` before starting the application. Never commit real credentials or secret values.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Check code style and common issues |
| `npm run typecheck` | Validate TypeScript types |
| `npm run admin:create` | Create and promote an admin account |
| `npm run gen:types` | Regenerate database types |
| `npm run preview` | Preview the production build |
| `npm run deploy` | Build and deploy the application |

Additional verification scripts are listed in `package.json`.

## Project Structure

```text
src/app/        Pages, layouts, and API routes
src/components/ Reusable interface components
src/lib/        Data access, actions, validation, and integrations
src/types/      Shared TypeScript types
scripts/        Verification and maintenance scripts
supabase/       Database migrations and seed data
docs/           Project documentation
```

## Data and Security

Catalogue content, user accounts, orders, and uploaded files are stored in Supabase. Server-side authorization and database policies protect admin and customer data. Secret values must only be provided through environment variables or the deployment platform's secret store.

## Documentation

Additional project notes and technical decisions are available in the [`docs/`](./docs/) directory.
