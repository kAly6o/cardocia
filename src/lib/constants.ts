// Constantes métier de Cardocia.

export const CATALOG_COLLECTIONS = [
  { name: "Wizards", slug: "wizards", description: "Les premières extensions du TCG (1999-2003).", sort_order: 1 },
  { name: "Diamant et Perle", slug: "diamant-et-perle", description: "Génération IV (2007-2009).", sort_order: 2 },
  { name: "Platine", slug: "platine", description: "Sous-série de Diamant et Perle (2009-2010).", sort_order: 3 },
  { name: "HeartGold SoulSilver", slug: "heartgold-soulsilver", description: "Génération IV (2010-2011).", sort_order: 4 },
  { name: "Noir et Blanc", slug: "noir-et-blanc", description: "Génération V (2011-2013).", sort_order: 5 },
  { name: "XY", slug: "xy", description: "Génération VI (2014-2016).", sort_order: 6 },
  { name: "Soleil et Lune", slug: "soleil-et-lune", description: "Génération VII (2017-2019).", sort_order: 7 },
  { name: "Épée et Bouclier", slug: "epee-et-bouclier", description: "Génération VIII (2020-2023).", sort_order: 8 },
  { name: "Écarlate et Violet", slug: "ecarlate-et-violet", description: "Génération IX (2023-aujourd'hui).", sort_order: 9 },
  { name: "Méga-Évolution", slug: "mega-evolution", description: "Cartes mettant en avant les Méga-Évolutions.", sort_order: 10 },
] as const;

export const CONDITIONS = [
  "Neuf",
  "Near Mint",
  "Excellent",
  "Très bon",
  "Bon",
  "Joué",
  "Abîmé",
] as const;

export const FINISHES = [
  "Normale",
  "Reverse",
  "Holographique",
  "Holo spéciale",
] as const;

export const RARITIES = [
  "Commune",
  "Peu commune",
  "Rare",
  "Holographique",
  "Reverse",
  "Ultra Rare",
  "Illustration Rare",
  "Spéciale Illustration Rare",
  "Hyper Rare",
  "Secret",
  "Promo",
] as const;

export const RARITY_COLORS: Record<string, string> = {
  "Commune": "text-zinc-300 bg-zinc-700/40 border-zinc-500/40",
  "Peu commune": "text-emerald-300 bg-emerald-900/30 border-emerald-600/40",
  "Rare": "text-sky-300 bg-sky-900/30 border-sky-600/40",
  "Holographique": "text-indigo-300 bg-indigo-900/30 border-indigo-500/40",
  "Reverse": "text-cyan-300 bg-cyan-900/30 border-cyan-600/40",
  "Ultra Rare": "text-fuchsia-300 bg-fuchsia-900/30 border-fuchsia-500/40",
  "Illustration Rare": "text-amber-300 bg-amber-900/30 border-amber-500/40",
  "Spéciale Illustration Rare": "text-yellow-200 bg-yellow-900/40 border-yellow-500/50",
  "Hyper Rare": "text-rose-200 bg-rose-900/40 border-rose-500/50",
  "Secret": "text-orange-200 bg-orange-900/40 border-orange-500/50",
  "Promo": "text-violet-300 bg-violet-900/30 border-violet-500/40",
};

export function rarityColor(rarity: string | null | undefined): string {
  return RARITY_COLORS[rarity ?? ""] ?? "text-zinc-300 bg-zinc-700/40 border-zinc-500/40";
}

export const POKEMON_TYPES: Record<string, string> = {
  "Plante": "#7AC74C",
  "Feu": "#EE8130",
  "Eau": "#6390F0",
  "Électrik": "#F7D02C",
  "Psy": "#F95587",
  "Combat": "#C22E28",
  "Ténèbres": "#705746",
  "Métal": "#B7B7CE",
  "Fée": "#D685AD",
  "Dragon": "#6F35FC",
  "Incolore": "#A8A77A",
  "Poison": "#A33EA1",
  "Sol": "#E2BF65",
  "Vol": "#A98FF3",
  "Insecte": "#A6B91A",
  "Roche": "#B6A136",
  "Spectre": "#735797",
  "Glace": "#96D9D6",
};

export function pokemonTypeColor(type: string | null | undefined): string {
  return POKEMON_TYPES[type ?? ""] ?? "#71717a";
}

export const POKEMON_TYPE_LABELS = Object.keys(POKEMON_TYPES);

export const LANGUAGES = [
  { code: "FR", label: "Français" },
  { code: "EN", label: "Anglais" },
  { code: "DE", label: "Allemand" },
  { code: "ES", label: "Espagnol" },
  { code: "IT", label: "Italien" },
  { code: "PT", label: "Portugais" },
  { code: "JA", label: "Japonais" },
  { code: "KO", label: "Coréen" },
  { code: "ZH", label: "Chinois" },
] as const;

export function languageLabel(code: string | null | undefined): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code ?? "—";
}

export const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "CAD", "JPY"] as const;

export const PRODUCT_TYPES = [
  "Carte",
  "Lot",
  "Booster",
  "Display",
  "ETB",
  "Coffret",
  "Tripack",
  "Blister",
  "Bundle",
  "Pokébox",
  "Autre",
] as const;

export const SEALED_PRODUCT_TYPES = [
  "Booster",
  "Display",
  "ETB",
  "Coffret",
  "Tripack",
  "Blister",
  "Bundle",
  "Pokébox",
] as const;

export const DEFAULT_PLATFORMS = [
  "Cardmarket",
  "eBay",
  "Vinted",
  "Leboncoin",
  "Vente directe",
] as const;

export const PURCHASE_STATUSES = ["En attente", "Reçu", "Annulé"] as const;
export const SALE_STATUSES = ["Brouillon", "Validée", "Annulée"] as const;
export const STOCK_STATUSES = ["Disponible", "Réservé", "Vendu", "Dans lot", "Dans booster"] as const;
export const LOT_STATUSES = ["Brouillon", "Disponible", "Réservé", "Vendu", "Annulé"] as const;
export const BOOSTER_STATUSES = ["Disponible", "Réservé", "Vendu", "Annulé"] as const;

export const MOVEMENT_TYPES = [
  "Ajout",
  "Achat",
  "Réception",
  "Transfert",
  "Réservation",
  "Libération",
  "Vente",
  "Lot",
  "Booster",
  "Ouverture",
  "Correction",
  "Annulation",
] as const;

export const BOOSTER_CATEGORIES = [
  "Commune",
  "Peu commune",
  "Rare",
  "Brillante",
  "Reverse",
  "Spéciale",
] as const;
