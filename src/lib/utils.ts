// Utilitaires génériques.

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const currencyLocales: Record<string, string> = {
  EUR: "fr-FR",
  USD: "en-US",
  GBP: "en-GB",
  CHF: "de-CH",
  CAD: "fr-CA",
  JPY: "ja-JP",
};

export function formatCurrency(
  value: number | null | undefined,
  currency = "EUR",
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const locale = currencyLocales[currency] ?? "fr-FR";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("fr-FR").format(value);
}

/** URL d'un logo TCGdex : l'API renvoie un chemin sans extension («.../logo»). */
export function logoUrl(logo: string | null | undefined): string | null {
  if (!logo) return null;
  return logo.endsWith(".png") ? logo : `${logo}.png`;
}

export function formatDate(
  value: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", options ?? { dateStyle: "medium" }).format(date);
}

/** Arrondit un montant à 2 décimales (calculs monétaires). */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Convertit une valeur libre en nombre décimal, ou `null`. */
export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const cleaned = value.replace(/\s/g, "").replace(",", ".").replace(/[^\d.-]/g, "");
    if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Convertit une valeur en entier, ou `null`. */
export function toInt(value: unknown): number | null {
  const n = toNumber(value);
  if (n === null) return null;
  return Math.trunc(n);
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}