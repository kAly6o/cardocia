// Analyse et génération de CSV (imports/exports).

export interface CsvParseResult {
  headers: string[];
  rows: string[][];
  delimiter: string;
}

/**
 * Analyse un contenu CSV en gérant les guillemets, les retours à la ligne
 * dans les champs et les séparateurs `;`, `,`, tabulation ou `|`.
 */
export function parseCsv(text: string): CsvParseResult {
  const cleaned = text.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(cleaned);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];

    if (inQuotes) {
      if (ch === '"') {
        if (cleaned[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && cleaned[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c.trim() !== "")) {
        rows.push(row);
      }
      row = [];
    } else {
      field += ch;
    }
  }

  // Dernier champ / ligne
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((c) => c.trim() !== "")) {
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    return { headers: [], rows: [], delimiter };
  }

  const headers = rows[0].map((h) => h.trim());
  return {
    headers,
    rows: rows.slice(1).filter((r) => r.some((c) => c.trim() !== "")),
    delimiter,
  };
}

/** Détecte le séparateur le plus probable sur la première ligne. */
export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const candidates = [";", ",", "\t", "|"];
  let best = ";";
  let bestCount = -1;
  for (const c of candidates) {
    const count = firstLine.split(c).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = c;
    }
  }
  return best;
}

/** Normalise un nom de colonne pour faciliter la correspondance. */
export function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Échappe une valeur pour la génération CSV. */
export function escapeCsv(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[;"\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Génère un contenu CSV à partir d'en-têtes et de lignes. */
export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers.map(escapeCsv).join(";")];
  for (const row of rows) {
    lines.push(row.map(escapeCsv).join(";"));
  }
  return `\uFEFF${lines.join("\r\n")}`;
}
