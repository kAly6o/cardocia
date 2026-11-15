-- Associe un booster reconditionné à la série de son emballage vide.
alter table public.booster_products
  add column if not exists set_id uuid references public.catalog_sets(id) on delete set null;