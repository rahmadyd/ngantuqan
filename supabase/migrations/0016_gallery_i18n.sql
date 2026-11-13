-- ngantuqan - 0016: gallery localisation
--
-- The gallery images carry the alt text that visitors read on the project and
-- product pages. The English stays on the row and the Indonesian wording sits
-- beside it in a translations JSONB column.
--
--   translations = { "id": { "alt_text": "..." } }

alter table public.project_images
  add column if not exists translations jsonb not null default '{}'::jsonb;

alter table public.product_images
  add column if not exists translations jsonb not null default '{}'::jsonb;

create index if not exists idx_project_images_translations
  ON public.project_images using gin (translations);

create index if not exists idx_product_images_translations
  ON public.product_images using gin (translations);
