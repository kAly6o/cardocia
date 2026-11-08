#!/usr/bin/env node
/**
 * Synchronisation du catalogue Cardocia depuis l'API publique TCGdex.
 *
 * Usage :
 *   node scripts/sync-tcgdex.mjs           # séries (collections) + extensions
 *   node scripts/sync-tcgdex.mjs --cards   # + cartes (long, ~20 000 cartes)
 *
 * Requiert SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (dans .env.local ou
 * l'environnement). Ne touche que les tables catalog_* (partagées).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const env = { ...process.env };
  try {
    const content = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of content.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* .env.local absent : on utilise process.env */
  }
  return env;
}

const env = loadEnv();
const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const API = "https://api.tcgdex.net/v2/fr";

// Raretés TCGdex (anglais) → Cardocia (français).
const RARITY_EN_FR = {
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
const mapRarity = (r) => RARITY_EN_FR[r] ?? r ?? null;

async function fetchJson(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${path}`);
  return res.json();
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}
async function main() {
  const withCards = process.argv.includes("--cards");

  console.log("Récupération des séries…");
  const series = await fetchJson("/series");
  console.log(`${series.length} séries trouvées.`);

  let collections = 0;
  let sets = 0;
  let cards = 0;

  for (let i = 0; i < series.length; i++) {
    const s = series[i];

    const { data: col, error: colErr } = await supabase
      .from("catalog_collections")
      .upsert(
        { name: s.name, slug: s.id, logo: s.logo ? `${s.logo}.png` : null, sort_order: i },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (colErr || !col) {
      console.warn(`Échec collection ${s.id}:`, colErr?.message);
      continue;
    }
    collections++;

    const detail = await fetchJson(`/series/${s.id}`);
    const seriesSets = detail.sets ?? [];

    for (const set of seriesSets) {
      try {
        const setDetail = await fetchJson(`/sets/${set.id}`);

        const { data: setRow, error: setErr } = await supabase
          .from("catalog_sets")
          .upsert(
            {
              collection_id: col.id,
              name: setDetail.name ?? set.name,
              external_id: set.id,
              symbol: setDetail.symbol ?? null,
              logo: setDetail.logo ? `${setDetail.logo}.png` : null,
              release_date: setDetail.releaseDate ?? null,
              card_count:
                setDetail.cardCount?.official ?? setDetail.cardCount?.total ?? null,
            },
            { onConflict: "external_id" },
          )
          .select("id")
          .single();
        if (setErr || !setRow) {
          throw new Error(setErr?.message || "échec upsert extension");
        }
        sets++;

        if (withCards) {
          const summaries = setDetail.cards ?? [];
          const details = await mapLimit(summaries, 15, async (c) => {
            try {
              return await fetchJson(`/cards/${c.id}`);
            } catch {
              return null;
            }
          });
          const byId = new Map(details.filter(Boolean).map((d) => [d.id, d]));

          const rows = summaries.map((c) => {
            const d = byId.get(c.id);
            const img = d?.image ?? c.image ?? null;
            return {
              set_id: setRow.id,
              name: d?.name ?? c.name,
              number: d?.localId ?? c.localId ?? "",
              external_id: c.id,
              image: img ? `${img}/high.webp` : null,
              rarity: mapRarity(d?.rarity),
              pokemon_type: d?.types?.[0] ?? null,
              illustrator: d?.illustrator ?? null,
              variants: d?.variants
                ? { normal: !!d.variants.normal, reverse: !!d.variants.reverse, holo: !!d.variants.holo }
                : null,
            };
          });

          for (let k = 0; k < rows.length; k += 500) {
            const { error } = await supabase
              .from("catalog_cards")
              .upsert(rows.slice(k, k + 500), { onConflict: "external_id" });
            if (error) console.error(`Erreur cartes ${set.id}:`, error.message);
          }
          cards += rows.length;
          console.log(`Cartes de ${set.id} : ${rows.length}`);
        }
      } catch (e) {
        console.warn(`Extension ${set.id} ignorée :`, e.message);
      }
    }
  }

  console.log(
    `Terminé : ${collections} collections, ${sets} extensions, ${cards} cartes.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

