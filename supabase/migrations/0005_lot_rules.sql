-- ============================================================================
-- Cardocia — Migration 0005 : règle de composition automatique des lots
-- ============================================================================

alter table public.lots
  add column if not exists rule jsonb;
