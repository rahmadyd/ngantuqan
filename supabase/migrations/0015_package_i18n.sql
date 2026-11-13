-- ngantuqan - 0015: package and media localisation
--
-- The service packages carry the wording the visitor reads next to the
-- price, so they are translated the same way the services are: the English
-- stays on the row and the Indonesian wording sits beside it.
--
--   translations = { "id": { "name": "...", "description": "..." } }

alter table public.service_packages
  add column if not exists translations jsonb not null default '{}'::jsonb;

create index if not exists idx_service_packages_translations
  ON public.service_packages using gin (translations);
