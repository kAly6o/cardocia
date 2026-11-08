// Types partagés de l'application Cardocia (reflète le schéma SQL).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface CatalogCollection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  sort_order: number;
  created_at: string;
}

export interface CatalogSet {
  id: string;
  collection_id: string;
  name: string;
  original_name: string | null;
  external_id: string | null;
  symbol: string | null;
  logo: string | null;
  release_date: string | null;
  card_count: number | null;
  extra: Json | null;
  created_at: string;
  collection?: CatalogCollection | null;
}

export interface CatalogCard {
  id: string;
  set_id: string;
  name: string;
  number: string;
  external_id: string | null;
  image: string | null;
  rarity: string | null;
  pokemon_type: string | null;
  illustrator: string | null;
  description: string | null;
  extra: Json | null;
  created_at: string;
  set?: CatalogSet | null;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  default_currency: string;
  settings: Json | null;
  created_at: string;
  updated_at: string;
}

export interface CollectionItem {
  id: string;
  user_id: string;
  card_id: string;
  language: string;
  condition: string;
  finish: string;
  acquisition_cost: number | null;
  estimated_value: number | null;
  acquisition_date: string | null;
  notes: string | null;
  location: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
  card?: CatalogCard | null;
}

export type StockStatus =
  | "Disponible"
  | "Réservé"
  | "Vendu"
  | "Dans lot"
  | "Dans booster";

export interface StockItem {
  id: string;
  user_id: string;
  card_id: string | null;
  collection_item_id: string | null;
  language: string;
  condition: string;
  finish: string;
  acquisition_cost: number | null;
  desired_price: number | null;
  estimated_value: number | null;
  status: StockStatus;
  quantity: number;
  entered_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  card?: CatalogCard | null;
}

export type MovementType =
  | "Ajout"
  | "Achat"
  | "Réception"
  | "Transfert"
  | "Réservation"
  | "Libération"
  | "Vente"
  | "Lot"
  | "Booster"
  | "Ouverture"
  | "Correction"
  | "Annulation";

export interface StockMovement {
  id: string;
  user_id: string;
  type: MovementType;
  card_id: string | null;
  collection_item_id: string | null;
  stock_item_id: string | null;
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  reason: string | null;
  previous_status: string | null;
  new_status: string | null;
  notes: string | null;
  created_at: string;
  card?: CatalogCard | null;
}

export interface Supplier {
  id: string;
  user_id: string;
  name: string;
  type: string | null;
  contact: string | null;
  website: string | null;
  notes: string | null;
  created_at: string;
}

export type PurchaseStatus = "En attente" | "Reçu" | "Annulé";

export type ProductType =
  | "Carte"
  | "Lot"
  | "Booster"
  | "Display"
  | "ETB"
  | "Coffret"
  | "Tripack"
  | "Blister"
  | "Bundle"
  | "Pokébox"
  | "Autre";

export interface Purchase {
  id: string;
  user_id: string;
  purchase_date: string;
  supplier_id: string | null;
  seller_name: string | null;
  reference: string | null;
  description: string | null;
  currency: string;
  shipping_cost: number | null;
  extra_fees: number | null;
  total: number | null;
  status: PurchaseStatus;
  notes: string | null;
  external_ref: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier | null;
  lines?: PurchaseLine[];
}

export interface PurchaseLine {
  id: string;
  purchase_id: string;
  user_id: string;
  card_id: string | null;
  product_type: ProductType;
  name: string;
  extension: string | null;
  card_number: string | null;
  language: string | null;
  condition: string | null;
  finish: string | null;
  quantity: number;
  unit_price: number;
  received: boolean;
  created_at: string;
  card?: CatalogCard | null;
}

export type SaleStatus = "Brouillon" | "Validée" | "Annulée";

export interface Sale {
  id: string;
  user_id: string;
  sale_date: string;
  platform: string;
  reference: string | null;
  buyer: string | null;
  currency: string;
  fees: number | null;
  shipping_fees: number | null;
  amount_received: number | null;
  cost_of_goods: number | null;
  profit: number | null;
  status: SaleStatus;
  notes: string | null;
  external_ref: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  lines?: SaleLine[];
}

export interface SaleLine {
  id: string;
  sale_id: string;
  user_id: string;
  card_id: string | null;
  stock_item_id: string | null;
  product_type: ProductType;
  name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number | null;
  created_at: string;
  card?: CatalogCard | null;
}

export type LotStatus = "Brouillon" | "Disponible" | "Réservé" | "Vendu" | "Annulé";

export interface Lot {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  desired_price: number | null;
  status: LotStatus;
  created_at: string;
  updated_at: string;
  lines?: LotLine[];
}

export interface LotLine {
  id: string;
  lot_id: string;
  user_id: string;
  stock_item_id: string | null;
  card_id: string | null;
  quantity: number;
  unit_cost: number | null;
  created_at: string;
  card?: CatalogCard | null;
}

export type BoosterStatus = "Disponible" | "Réservé" | "Vendu" | "Annulé";

export interface BoosterRecipe {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  language: string;
  card_count: number | null;
  desired_price: number | null;
  quotas: Json | null;
  categories: Json | null;
  created_at: string;
}

export interface BoosterProduct {
  id: string;
  user_id: string;
  recipe_id: string | null;
  name: string;
  production_cost: number | null;
  desired_price: number | null;
  status: BoosterStatus;
  made_at: string | null;
  created_at: string;
  lines?: BoosterLine[];
}

export interface BoosterLine {
  id: string;
  booster_id: string;
  user_id: string;
  stock_item_id: string | null;
  card_id: string | null;
  quantity: number;
  unit_cost: number | null;
  created_at: string;
  card?: CatalogCard | null;
}

export interface SealedProduct {
  id: string;
  user_id: string;
  name: string;
  product_type: ProductType;
  set_id: string | null;
  language: string;
  quantity: number;
  purchase_price: number | null;
  estimated_value: number | null;
  condition: string;
  purchase_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  set?: CatalogSet | null;
}

export interface ProductOpening {
  id: string;
  user_id: string;
  sealed_product_id: string | null;
  opened_at: string;
  quantity_opened: number;
  allocated_cost: number | null;
  notes: string | null;
  created_at: string;
  lines?: ProductOpeningLine[];
}

export interface ProductOpeningLine {
  id: string;
  opening_id: string;
  user_id: string;
  card_id: string | null;
  destination: "collection" | "stock";
  quantity: number;
  language: string | null;
  condition: string | null;
  finish: string | null;
  created_at: string;
  card?: CatalogCard | null;
}

export type ImportType = "achats" | "ventes" | "inventaire";

export interface ImportBatch {
  id: string;
  user_id: string;
  platform: string;
  import_type: ImportType;
  file_name: string | null;
  total_rows: number;
  imported_rows: number;
  duplicate_rows: number;
  error_rows: number;
  details: Json | null;
  created_at: string;
}

export interface ImportedTransaction {
  id: string;
  user_id: string;
  batch_id: string | null;
  platform: string;
  import_type: ImportType;
  external_ref: string;
  status: "importée" | "ignorée" | "doublon" | "erreur";
  raw: Json | null;
  linked_purchase_id: string | null;
  linked_sale_id: string | null;
  message: string | null;
  created_at: string;
}

export interface CardPrice {
  id: string;
  card_id: string;
  language: string | null;
  finish: string | null;
  condition: string | null;
  price: number;
  currency: string;
  source: string | null;
  updated_at: string;
}

export interface CardPriceHistory {
  id: string;
  card_price_id: string | null;
  card_id: string;
  price: number;
  recorded_at: string;
}


