-- ngantuqan - 0014: localisation
--
-- The studio publishes in English and Indonesian. A record keeps one row, so
-- the slug stays unique and the media, the packages and the order history
-- stay attached to it. The Indonesian wording lives in a `translations` JSONB
-- column beside the English fields:
--
--   translations = { "id": { "title": "...", "description": "..." } }
--
-- A field that is not present in the translation keeps the English text, so a
-- half-translated record still reads properly on the site.

alter table public.categories
  add column if not exists translations jsonb not null default '{}'::jsonb;

alter table public.projects
  add column if not exists translations jsonb not null default '{}'::jsonb;

alter table public.services
  add column if not exists translations jsonb not null default '{}'::jsonb;

alter table public.products
  add column if not exists translations jsonb not null default '{}'::jsonb;

alter table public.testimonials
  add column if not exists translations jsonb not null default '{}'::jsonb;

-- The categories feed a filter list, so the language belongs in the index.
create index if not exists idx_categories_translations
  ON public.categories using gin (translations);

create index if not exists idx_projects_translations
  ON public.projects using gin (translations);

create index if not exists idx_services_translations
  ON public.services using gin (translations);

create index if not exists idx_products_translations
  ON public.products using gin (translations);

create index if not exists idx_testimonials_translations
  ON public.testimonials using gin (translations);
