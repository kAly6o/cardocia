-- ============================================================================
-- Cardocia — Migration 0004 : variantes d'impression (normal / reverse / holo)
-- ============================================================================

alter table public.catalog_cards
  add column if not exists variants jsonb;
