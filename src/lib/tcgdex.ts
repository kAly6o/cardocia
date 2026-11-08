// Client TCGdex (utilisé uniquement côté serveur : Server Actions / Server Components).

export const TCGDEX_API = "https://api.tcgdex.net/v2/fr";

export async function fetchTcgdex<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${TCGDEX_API}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`TCGdex HTTP ${res.status} (${path})`);
  return (await res.json()) as T;
}

// --- Types (extraits de l'API TCGdex) ---

export interface TcgdexSeriesSummary {
  id: string;
  name: string;
  logo?: string | null;
}

export interface TcgdexSetSummary {
  id: string;
  name: string;
  logo?: string | null;
  symbol?: string | null;
  cardCount?: { official?: number; total?: number } | null;
}

export interface TcgdexSeriesDetail {
  id: string;
  name: string;
  logo?: string | null;
  sets?: TcgdexSetSummary[];
}

export interface TcgdexCardSummary {
  id: string;
  localId?: string;
  name: string;
  image?: string | null;
}

export interface TcgdexSetDetail {
  id: string;
  name: string;
  logo?: string | null;
  symbol?: string | null;
  releaseDate?: string | null;
  cardCount?: { official?: number; total?: number } | null;
  cards?: TcgdexCardSummary[];
}

export interface TcgdexCardDetail {
  id: string;
  localId?: string;
  name: string;
  image?: string | null;
  rarity?: string | null;
  types?: string[];
  category?: string | null;
  illustrator?: string | null;
  variants?: {
    normal?: boolean;
    reverse?: boolean;
    holo?: boolean;
  } | null;
}

// Raretés TCGdex (anglais) → Cardocia (français).
const RARITY_EN_FR: Record<string, string> = {
  Common: "Commune",
  Uncommon: "Peu commune",
  Rare: "Rare",
  "Holo Rare": "Holographique",
  "Holo Rare V": "Holographique",
  "Holo Rare VMAX": "Holographique",
  "Holo Rare VSTAR": "Holographique",
  "Double Rare": "Rare",
  "Ultra Rare": "Ultra Rare",
  "Illustration Rare": "Illustration Rare",
  "Special Illustration Rare": "Spéciale Illustration Rare",
  "Hyper Rare": "Hyper Rare",
  "Secret Rare": "Secret",
  "Shiny Rare": "Secret",
  "Shiny Ultra Rare": "Secret",
  "Radiant Rare": "Ultra Rare",
  "Amazing Rare": "Ultra Rare",
  "ACE SPEC Rare": "Secret",
  Reverse: "Reverse",
  Promo: "Promo",
};

export function mapRarity(rarity: string | null | undefined): string | null {
  if (!rarity) return null;
  return RARITY_EN_FR[rarity] ?? rarity;
}

/** URL d'image haute résolution TCGdex. */
export function cardImageUrl(image: string | null | undefined): string | null {
  if (!image) return null;
  return `${image}/high.webp`;
}
