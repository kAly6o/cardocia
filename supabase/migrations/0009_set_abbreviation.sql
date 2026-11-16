-- Code français de l'extension (ex. E&V pour Écarlate et Violet, FAP pour
-- Faille Paradoxe) fourni par TCGdex (`abbreviation.localized`), à afficher
-- à côté du nom de l'extension.
alter table public.catalog_sets
  add column if not exists abbreviation text;