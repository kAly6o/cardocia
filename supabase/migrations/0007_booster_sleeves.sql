-- ============================================================================
-- Stock d'emballages de boosters vides par série (reconditionnement)
-- ============================================================================

create table if not exists public.booster_sleeves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  set_id uuid references public.catalog_sets(id) on delete cascade,
  quantity int not null default 0 check (quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, set_id)
);

create index if not exists idx_booster_sleeves_user on public.booster_sleeves(user_id);

alter table public.booster_sleeves enable row level security;
create policy "booster_sleeves_select" on public.booster_sleeves
  for select using (auth.uid() = user_id);
create policy "booster_sleeves_insert" on public.booster_sleeves
  for insert with check (auth.uid() = user_id);
create policy "booster_sleeves_update" on public.booster_sleeves
  for update using (auth.uid() = user_id);
create policy "booster_sleeves_delete" on public.booster_sleeves
  for delete using (auth.uid() = user_id);