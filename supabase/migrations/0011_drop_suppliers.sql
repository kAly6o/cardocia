-- Retrait des fournisseurs (cahier des charges v1.1).
-- Les achats utilisent le champ `seller_name` ; la notion de fournisseur séparé
-- n'est pas nécessaire.

-- 1. Détache les achats de la table fournisseurs (la colonne et sa FK disparaissent).
alter table public.purchases
  drop column if exists supplier_id;

-- 2. Supprime la table fournisseurs (policies et index supprimés en même temps).
drop table if exists public.suppliers cascade;