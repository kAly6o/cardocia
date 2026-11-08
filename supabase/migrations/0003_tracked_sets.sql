-- ============================================================================
-- Cardocia — Migration 0003 : suivi d'extensions (collection tracker)
-- ============================================================================

create table if not exists public.tracked_sets (
  user_id uuid not null references auth.users(id) on delete cascade,
  set_id uuid not null references public.catalog_sets(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, set_id)
);

alter table public.tracked_sets enable row level security;
drop policy if exists "tracked_select" on public.tracked_sets;
create policy "tracked_select" on public.tracked_sets
  for select using (auth.uid() = user_id);
drop policy if exists "tracked_insert" on public.tracked_sets;
create policy "tracked_insert" on public.tracked_sets
  for insert with check (auth.uid() = user_id);
drop policy if exists "tracked_delete" on public.tracked_sets;
create policy "tracked_delete" on public.tracked_sets
  for delete using (auth.uid() = user_id);
