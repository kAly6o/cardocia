-- Bucket public pour les logos de catalogue (collections / extensions)
-- importés manuellement par un administrateur.
insert into storage.buckets (id, name, public)
values ('catalog-logos', 'catalog-logos', true)
on conflict (id) do nothing;