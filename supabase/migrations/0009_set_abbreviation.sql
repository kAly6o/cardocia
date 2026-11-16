-- Code officiel de l'extension (ex. SVI pour Écarlate et Violet, PAR pour
-- Faille Paradoxe) fourni par TCGdex (`abbreviation.official`), à afficher
-- à côté du nom de l'extension.
alter table public.catalog_sets
  add column if not exists abbreviation text;