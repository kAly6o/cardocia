-- ============================================================================
-- Cardocia — Migration initiale
-- Schéma de base + sécurité (RLS) + données de référence.
-- À appliquer via : supabase db push  (ou dans le SQL Editor du dashboard)
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Catalogue partagé (aucune donnée personnelle)
-- ---------------------------------------------------------------------------

create table if not exists public.catalog_collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  logo text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_sets (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.catalog_collections(id) on delete cascade,
  name text not null,
  original_name text,
  external_id text,
  symbol text,
  logo text,
  release_date date,
  card_count int,
  extra jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_catalog_sets_collection on public.catalog_sets(collection_id);
create index if not exists idx_catalog_sets_name on public.catalog_sets(name);

create table if not exists public.catalog_cards (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.catalog_sets(id) on delete cascade,
  name text not null,
  number text not null,
  external_id text,
  image text,
  rarity text,
  pokemon_type text,
  illustrator text,
  description text,
  extra jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_catalog_cards_set on public.catalog_cards(set_id);
create index if not exists idx_catalog_cards_name on public.catalog_cards(name);
create index if not exists idx_catalog_cards_number on public.catalog_cards(number);
create index if not exists idx_catalog_cards_rarity on public.catalog_cards(rarity);
create index if not exists idx_catalog_cards_type on public.catalog_cards(pokemon_type);

-- Unicité des identifiants externes (synchronisation TCGdex / upsert).
alter table public.catalog_sets
  drop constraint if exists uq_catalog_sets_external;
alter table public.catalog_sets
  add constraint uq_catalog_sets_external unique (external_id);
alter table public.catalog_cards
  drop constraint if exists uq_catalog_cards_external;
alter table public.catalog_cards
  add constraint uq_catalog_cards_external unique (external_id);

-- ---------------------------------------------------------------------------
-- Profils utilisateurs (liés à auth.users)
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  default_currency text not null default 'EUR',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
-- ---------------------------------------------------------------------------
-- Collection personnelle (exemplaires conservés)
-- ---------------------------------------------------------------------------

create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.catalog_cards(id) on delete restrict,
  language text not null default 'FR',
  condition text not null default 'Near Mint',
  finish text not null default 'Normale',
  acquisition_cost numeric(12,2),
  estimated_value numeric(12,2),
  acquisition_date date,
  notes text,
  location text,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_collection_user on public.collection_items(user_id);
create index if not exists idx_collection_card on public.collection_items(card_id);

drop trigger if exists trg_collection_updated on public.collection_items;
create trigger trg_collection_updated before update on public.collection_items
  for each row execute procedure public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Stock à vendre (exemplaires destinés à la revente)
-- ---------------------------------------------------------------------------

create table if not exists public.stock_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid references public.catalog_cards(id) on delete restrict,
  collection_item_id uuid references public.collection_items(id) on delete set null,
  language text not null default 'FR',
  condition text not null default 'Near Mint',
  finish text not null default 'Normale',
  acquisition_cost numeric(12,2),
  desired_price numeric(12,2),
  estimated_value numeric(12,2),
  status text not null default 'Disponible'
    check (status in ('Disponible','Réservé','Vendu','Dans lot','Dans booster')),
  quantity int not null default 1 check (quantity > 0),
  entered_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_stock_user on public.stock_items(user_id);
create index if not exists idx_stock_card on public.stock_items(card_id);
create index if not exists idx_stock_status on public.stock_items(status);

drop trigger if exists trg_stock_updated on public.stock_items;
create trigger trg_stock_updated before update on public.stock_items
  for each row execute procedure public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Mouvements (traçabilité)
-- ---------------------------------------------------------------------------

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in (
    'Ajout','Achat','Réception','Transfert','Réservation','Libération',
    'Vente','Lot','Booster','Ouverture','Correction','Annulation'
  )),
  card_id uuid references public.catalog_cards(id) on delete set null,
  collection_item_id uuid references public.collection_items(id) on delete set null,
  stock_item_id uuid references public.stock_items(id) on delete set null,
  quantity int not null default 1,
  reference_type text,
  reference_id uuid,
  reason text,
  previous_status text,
  new_status text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_movements_user on public.stock_movements(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Fournisseurs
-- ---------------------------------------------------------------------------

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text,
  contact text,
  website text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_suppliers_user on public.suppliers(user_id);
-- ---------------------------------------------------------------------------
-- Achats (commandes fournisseurs)
-- ---------------------------------------------------------------------------

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purchase_date date not null default current_date,
  supplier_id uuid references public.suppliers(id) on delete set null,
  seller_name text,
  reference text,
  description text,
  currency text not null default 'EUR',
  shipping_cost numeric(12,2),
  extra_fees numeric(12,2),
  total numeric(12,2),
  status text not null default 'En attente'
    check (status in ('En attente','Reçu','Annulé')),
  notes text,
  external_ref text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_purchases_user on public.purchases(user_id);

drop trigger if exists trg_purchases_updated on public.purchases;
create trigger trg_purchases_updated before update on public.purchases
  for each row execute procedure public.handle_updated_at();

create table if not exists public.purchase_lines (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid references public.catalog_cards(id) on delete set null,
  product_type text not null default 'Carte',
  name text not null,
  extension text,
  card_number text,
  language text,
  condition text,
  finish text,
  quantity int not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  received boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_purchase_lines_purchase on public.purchase_lines(purchase_id);
create index if not exists idx_purchase_lines_user on public.purchase_lines(user_id);

-- ---------------------------------------------------------------------------
-- Ventes
-- ---------------------------------------------------------------------------

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sale_date date not null default current_date,
  platform text not null default 'Vente directe',
  reference text,
  buyer text,
  currency text not null default 'EUR',
  fees numeric(12,2),
  shipping_fees numeric(12,2),
  amount_received numeric(12,2),
  cost_of_goods numeric(12,2),
  profit numeric(12,2),
  status text not null default 'Brouillon'
    check (status in ('Brouillon','Validée','Annulée')),
  notes text,
  external_ref text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sales_user on public.sales(user_id);

drop trigger if exists trg_sales_updated on public.sales;
create trigger trg_sales_updated before update on public.sales
  for each row execute procedure public.handle_updated_at();

create table if not exists public.sale_lines (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid references public.catalog_cards(id) on delete set null,
  stock_item_id uuid references public.stock_items(id) on delete set null,
  product_type text not null default 'Carte',
  name text not null,
  quantity int not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  unit_cost numeric(12,2),
  created_at timestamptz not null default now()
);

create index if not exists idx_sale_lines_sale on public.sale_lines(sale_id);
create index if not exists idx_sale_lines_user on public.sale_lines(user_id);
-- ---------------------------------------------------------------------------
-- Lots
-- ---------------------------------------------------------------------------

create table if not exists public.lots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  desired_price numeric(12,2),
  status text not null default 'Brouillon'
    check (status in ('Brouillon','Disponible','Réservé','Vendu','Annulé')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lots_user on public.lots(user_id);

drop trigger if exists trg_lots_updated on public.lots;
create trigger trg_lots_updated before update on public.lots
  for each row execute procedure public.handle_updated_at();

create table if not exists public.lot_lines (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.lots(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stock_item_id uuid references public.stock_items(id) on delete set null,
  card_id uuid references public.catalog_cards(id) on delete set null,
  quantity int not null default 1 check (quantity > 0),
  unit_cost numeric(12,2),
  created_at timestamptz not null default now()
);

create index if not exists idx_lot_lines_lot on public.lot_lines(lot_id);

-- ---------------------------------------------------------------------------
-- Boosters reconditionnés (recettes + produits fabriqués)
-- ---------------------------------------------------------------------------

create table if not exists public.booster_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  language text not null default 'FR',
  card_count int,
  desired_price numeric(12,2),
  quotas jsonb,
  categories jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_booster_recipes_user on public.booster_recipes(user_id);

create table if not exists public.booster_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid references public.booster_recipes(id) on delete set null,
  name text not null,
  production_cost numeric(12,2),
  desired_price numeric(12,2),
  status text not null default 'Disponible'
    check (status in ('Disponible','Réservé','Vendu','Annulé')),
  made_at date,
  created_at timestamptz not null default now()
);

create index if not exists idx_booster_products_user on public.booster_products(user_id);

create table if not exists public.booster_lines (
  id uuid primary key default gen_random_uuid(),
  booster_id uuid not null references public.booster_products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stock_item_id uuid references public.stock_items(id) on delete set null,
  card_id uuid references public.catalog_cards(id) on delete set null,
  quantity int not null default 1 check (quantity > 0),
  unit_cost numeric(12,2),
  created_at timestamptz not null default now()
);

create index if not exists idx_booster_lines_booster on public.booster_lines(booster_id);
-- ---------------------------------------------------------------------------
-- Produits scellés + ouvertures
-- ---------------------------------------------------------------------------

create table if not exists public.sealed_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  product_type text not null default 'Booster',
  set_id uuid references public.catalog_sets(id) on delete set null,
  language text not null default 'FR',
  quantity int not null default 1 check (quantity >= 0),
  purchase_price numeric(12,2),
  estimated_value numeric(12,2),
  condition text not null default 'Neuf',
  purchase_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sealed_user on public.sealed_products(user_id);

drop trigger if exists trg_sealed_updated on public.sealed_products;
create trigger trg_sealed_updated before update on public.sealed_products
  for each row execute procedure public.handle_updated_at();

create table if not exists public.product_openings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sealed_product_id uuid references public.sealed_products(id) on delete set null,
  opened_at date not null default current_date,
  quantity_opened int not null default 1 check (quantity_opened > 0),
  allocated_cost numeric(12,2),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_openings_user on public.product_openings(user_id);

create table if not exists public.product_opening_lines (
  id uuid primary key default gen_random_uuid(),
  opening_id uuid not null references public.product_openings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid references public.catalog_cards(id) on delete set null,
  destination text not null default 'collection'
    check (destination in ('collection','stock')),
  quantity int not null default 1 check (quantity > 0),
  language text,
  condition text,
  finish text,
  created_at timestamptz not null default now()
);

create index if not exists idx_opening_lines_opening on public.product_opening_lines(opening_id);

-- ---------------------------------------------------------------------------
-- Imports CSV
-- ---------------------------------------------------------------------------

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  import_type text not null check (import_type in ('achats','ventes','inventaire')),
  file_name text,
  total_rows int not null default 0,
  imported_rows int not null default 0,
  duplicate_rows int not null default 0,
  error_rows int not null default 0,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_import_batches_user on public.import_batches(user_id, created_at desc);

create table if not exists public.imported_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  batch_id uuid references public.import_batches(id) on delete cascade,
  platform text not null,
  import_type text not null check (import_type in ('achats','ventes','inventaire')),
  external_ref text not null,
  status text not null default 'importée'
    check (status in ('importée','ignorée','doublon','erreur')),
  raw jsonb,
  linked_purchase_id uuid references public.purchases(id) on delete set null,
  linked_sale_id uuid references public.sales(id) on delete set null,
  message text,
  created_at timestamptz not null default now(),
  unique (user_id, platform, import_type, external_ref)
);

create index if not exists idx_imported_transactions_user on public.imported_transactions(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Prix du marché (préparation intégration future)
-- ---------------------------------------------------------------------------

create table if not exists public.card_prices (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.catalog_cards(id) on delete cascade,
  language text,
  finish text,
  condition text,
  price numeric(12,2) not null,
  currency text not null default 'EUR',
  source text,
  updated_at timestamptz not null default now(),
  unique (card_id, language, finish, condition)
);

create index if not exists idx_card_prices_card on public.card_prices(card_id);

create table if not exists public.card_price_history (
  id uuid primary key default gen_random_uuid(),
  card_price_id uuid references public.card_prices(id) on delete cascade,
  card_id uuid not null references public.catalog_cards(id) on delete cascade,
  price numeric(12,2) not null,
  recorded_at timestamptz not null default now()
);

create index if not exists idx_card_price_history_card on public.card_price_history(card_id, recorded_at desc);
-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- --- Catalogue partagé : lecture pour tous les utilisateurs connectés ---

alter table public.catalog_collections enable row level security;
create policy "catalog_collections_read" on public.catalog_collections
  for select to authenticated using (true);

alter table public.catalog_sets enable row level security;
create policy "catalog_sets_read" on public.catalog_sets
  for select to authenticated using (true);

alter table public.catalog_cards enable row level security;
create policy "catalog_cards_read" on public.catalog_cards
  for select to authenticated using (true);

-- --- Prix du marché : lecture partagée ---

alter table public.card_prices enable row level security;
create policy "card_prices_read" on public.card_prices
  for select to authenticated using (true);

alter table public.card_price_history enable row level security;
create policy "card_price_history_read" on public.card_price_history
  for select to authenticated using (true);

-- --- Profils : l'utilisateur gère son propre profil ---

alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Tables personnelles : politiques standard "propriétaire"
-- ---------------------------------------------------------------------------

alter table public.collection_items enable row level security;
create policy "collection_select" on public.collection_items for select using (auth.uid() = user_id);
create policy "collection_insert" on public.collection_items for insert with check (auth.uid() = user_id);
create policy "collection_update" on public.collection_items for update using (auth.uid() = user_id);
create policy "collection_delete" on public.collection_items for delete using (auth.uid() = user_id);

alter table public.stock_items enable row level security;
create policy "stock_select" on public.stock_items for select using (auth.uid() = user_id);
create policy "stock_insert" on public.stock_items for insert with check (auth.uid() = user_id);
create policy "stock_update" on public.stock_items for update using (auth.uid() = user_id);
create policy "stock_delete" on public.stock_items for delete using (auth.uid() = user_id);

alter table public.stock_movements enable row level security;
create policy "movements_select" on public.stock_movements for select using (auth.uid() = user_id);
create policy "movements_insert" on public.stock_movements for insert with check (auth.uid() = user_id);

alter table public.suppliers enable row level security;
create policy "suppliers_select" on public.suppliers for select using (auth.uid() = user_id);
create policy "suppliers_insert" on public.suppliers for insert with check (auth.uid() = user_id);
create policy "suppliers_update" on public.suppliers for update using (auth.uid() = user_id);
create policy "suppliers_delete" on public.suppliers for delete using (auth.uid() = user_id);

alter table public.purchases enable row level security;
create policy "purchases_select" on public.purchases for select using (auth.uid() = user_id);
create policy "purchases_insert" on public.purchases for insert with check (auth.uid() = user_id);
create policy "purchases_update" on public.purchases for update using (auth.uid() = user_id);
create policy "purchases_delete" on public.purchases for delete using (auth.uid() = user_id);

alter table public.purchase_lines enable row level security;
create policy "purchase_lines_select" on public.purchase_lines for select using (auth.uid() = user_id);
create policy "purchase_lines_insert" on public.purchase_lines for insert with check (auth.uid() = user_id);
create policy "purchase_lines_update" on public.purchase_lines for update using (auth.uid() = user_id);
create policy "purchase_lines_delete" on public.purchase_lines for delete using (auth.uid() = user_id);
alter table public.sales enable row level security;
create policy "sales_select" on public.sales for select using (auth.uid() = user_id);
create policy "sales_insert" on public.sales for insert with check (auth.uid() = user_id);
create policy "sales_update" on public.sales for update using (auth.uid() = user_id);
create policy "sales_delete" on public.sales for delete using (auth.uid() = user_id);

alter table public.sale_lines enable row level security;
create policy "sale_lines_select" on public.sale_lines for select using (auth.uid() = user_id);
create policy "sale_lines_insert" on public.sale_lines for insert with check (auth.uid() = user_id);
create policy "sale_lines_update" on public.sale_lines for update using (auth.uid() = user_id);
create policy "sale_lines_delete" on public.sale_lines for delete using (auth.uid() = user_id);

alter table public.lots enable row level security;
create policy "lots_select" on public.lots for select using (auth.uid() = user_id);
create policy "lots_insert" on public.lots for insert with check (auth.uid() = user_id);
create policy "lots_update" on public.lots for update using (auth.uid() = user_id);
create policy "lots_delete" on public.lots for delete using (auth.uid() = user_id);

alter table public.lot_lines enable row level security;
create policy "lot_lines_select" on public.lot_lines for select using (auth.uid() = user_id);
create policy "lot_lines_insert" on public.lot_lines for insert with check (auth.uid() = user_id);
create policy "lot_lines_update" on public.lot_lines for update using (auth.uid() = user_id);
create policy "lot_lines_delete" on public.lot_lines for delete using (auth.uid() = user_id);

alter table public.booster_recipes enable row level security;
create policy "booster_recipes_select" on public.booster_recipes for select using (auth.uid() = user_id);
create policy "booster_recipes_insert" on public.booster_recipes for insert with check (auth.uid() = user_id);
create policy "booster_recipes_update" on public.booster_recipes for update using (auth.uid() = user_id);
create policy "booster_recipes_delete" on public.booster_recipes for delete using (auth.uid() = user_id);

alter table public.booster_products enable row level security;
create policy "booster_products_select" on public.booster_products for select using (auth.uid() = user_id);
create policy "booster_products_insert" on public.booster_products for insert with check (auth.uid() = user_id);
create policy "booster_products_update" on public.booster_products for update using (auth.uid() = user_id);
create policy "booster_products_delete" on public.booster_products for delete using (auth.uid() = user_id);

alter table public.booster_lines enable row level security;
create policy "booster_lines_select" on public.booster_lines for select using (auth.uid() = user_id);
create policy "booster_lines_insert" on public.booster_lines for insert with check (auth.uid() = user_id);
create policy "booster_lines_update" on public.booster_lines for update using (auth.uid() = user_id);
create policy "booster_lines_delete" on public.booster_lines for delete using (auth.uid() = user_id);

alter table public.sealed_products enable row level security;
create policy "sealed_select" on public.sealed_products for select using (auth.uid() = user_id);
create policy "sealed_insert" on public.sealed_products for insert with check (auth.uid() = user_id);
create policy "sealed_update" on public.sealed_products for update using (auth.uid() = user_id);
create policy "sealed_delete" on public.sealed_products for delete using (auth.uid() = user_id);

alter table public.product_openings enable row level security;
create policy "openings_select" on public.product_openings for select using (auth.uid() = user_id);
create policy "openings_insert" on public.product_openings for insert with check (auth.uid() = user_id);
create policy "openings_update" on public.product_openings for update using (auth.uid() = user_id);
create policy "openings_delete" on public.product_openings for delete using (auth.uid() = user_id);

alter table public.product_opening_lines enable row level security;
create policy "opening_lines_select" on public.product_opening_lines for select using (auth.uid() = user_id);
create policy "opening_lines_insert" on public.product_opening_lines for insert with check (auth.uid() = user_id);
create policy "opening_lines_update" on public.product_opening_lines for update using (auth.uid() = user_id);
create policy "opening_lines_delete" on public.product_opening_lines for delete using (auth.uid() = user_id);

alter table public.import_batches enable row level security;
create policy "import_batches_select" on public.import_batches for select using (auth.uid() = user_id);
create policy "import_batches_insert" on public.import_batches for insert with check (auth.uid() = user_id);
create policy "import_batches_update" on public.import_batches for update using (auth.uid() = user_id);
create policy "import_batches_delete" on public.import_batches for delete using (auth.uid() = user_id);

alter table public.imported_transactions enable row level security;
create policy "imported_tx_select" on public.imported_transactions for select using (auth.uid() = user_id);
create policy "imported_tx_insert" on public.imported_transactions for insert with check (auth.uid() = user_id);
create policy "imported_tx_update" on public.imported_transactions for update using (auth.uid() = user_id);
create policy "imported_tx_delete" on public.imported_transactions for delete using (auth.uid() = user_id);
-- ============================================================================
-- Catalogue : rempli via l'import TCGdex (page admin /admin/tcgdex ou script
-- scripts/sync-tcgdex.mjs). Aucune donnée de collection n'est en dur.
-- ============================================================================

-- ============================================================================
-- Bucket de stockage des avatars
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and name like (auth.uid()::text || '/%'));

create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and name like (auth.uid()::text || '/%'));

create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and name like (auth.uid()::text || '/%'));