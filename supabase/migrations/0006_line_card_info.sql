-- ============================================================================
-- Cardocia — Migration 0006 : infos carte sur les lignes lot/booster
-- (pour restaurer correctement les cartes en stock lors d'un retrait/annulation)
-- ============================================================================

alter table public.lot_lines add column if not exists language text;
alter table public.lot_lines add column if not exists condition text;
alter table public.lot_lines add column if not exists finish text;

alter table public.booster_lines add column if not exists language text;
alter table public.booster_lines add column if not exists condition text;
alter table public.booster_lines add column if not exists finish text;
