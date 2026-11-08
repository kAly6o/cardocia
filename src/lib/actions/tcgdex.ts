"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/get-user";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionState } from "@/components/ui/Form";
import {
  fetchTcgdex,
  mapRarity,
  cardImageUrl,
  type TcgdexSeriesSummary,
  type TcgdexSeriesDetail,
  type TcgdexSetDetail,
  type TcgdexCardDetail,
} from "@/lib/tcgdex";

/** Exécute `fn` sur `items` avec un parallélisme limité (évite de surcharger l'API). */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (cursor < items.length) {
        const i = cursor++;
        results[i] = await fn(items[i]);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

export async function importTcgdexSeries(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const supabase = createAdminClient();

  const selected = formData
    .getAll("series")
    .map((v) => String(v))
    .filter(Boolean);
  if (selected.length === 0) {
    return { error: "Sélectionnez au moins une série à importer." };
  }

  let seriesList: TcgdexSeriesSummary[];
  try {
    seriesList = await fetchTcgdex<TcgdexSeriesSummary[]>("/series");
  } catch (e) {
    return { error: `Impossible de joindre TCGdex : ${(e as Error).message}` };
  }

  const byId = new Map(
    seriesList.map((s, index) => [s.id, { ...s, index }]),
  );

  let collections = 0;
  let sets = 0;
  let cards = 0;
  const errors: string[] = [];

  for (const id of selected) {
    const series = byId.get(id);
    if (!series) {
      errors.push(`Série inconnue : ${id}`);
      continue;
    }

    try {
      // 1. Collection (upsert sur slug).
      const { data: col, error: colErr } = await supabase
        .from("catalog_collections")
        .upsert(
          {
            name: series.name,
            slug: series.id,
            logo: series.logo ? `${series.logo}.png` : null,
            sort_order: series.index,
          },
          { onConflict: "slug" },
        )
        .select("id")
        .single();
      if (colErr || !col) throw new Error("échec de la collection");
      collections++;

      // 2. Extensions + cartes.
      const detail = await fetchTcgdex<TcgdexSeriesDetail>(`/series/${series.id}`);
      const seriesSets = detail.sets ?? [];

      for (const s of seriesSets) {
        try {
          const setDetail = await fetchTcgdex<TcgdexSetDetail>(`/sets/${s.id}`);

          const { data: setRow, error: setErr } = await supabase
            .from("catalog_sets")
            .upsert(
              {
                collection_id: col.id,
                name: setDetail.name ?? s.name,
                external_id: s.id,
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
          if (setErr || !setRow) throw new Error("échec upsert extension");

          // Détails des cartes (rarité / type) — carte par carte.
          const summaries = setDetail.cards ?? [];
          const details = await mapLimit(summaries, 15, async (c) => {
            try {
              return await fetchTcgdex<TcgdexCardDetail>(`/cards/${c.id}`);
            } catch {
              return null;
            }
          });
          const detailById = new Map<string, TcgdexCardDetail>();
          for (const d of details) if (d) detailById.set(d.id, d);

          const rows = summaries.map((c) => {
            const d = detailById.get(c.id);
            return {
              set_id: setRow.id,
              name: d?.name ?? c.name,
              number: d?.localId ?? c.localId ?? "",
              external_id: c.id,
              image: cardImageUrl(d?.image ?? c.image),
              rarity: mapRarity(d?.rarity),
              pokemon_type: d?.types?.[0] ?? null,
              illustrator: d?.illustrator ?? null,
              variants: d?.variants
                ? { normal: !!d.variants.normal, reverse: !!d.variants.reverse, holo: !!d.variants.holo }
                : null,
            };
          });

          for (let i = 0; i < rows.length; i += 500) {
            const { error } = await supabase
              .from("catalog_cards")
              .upsert(rows.slice(i, i + 500), { onConflict: "external_id" });
            if (error) errors.push(`cartes ${s.id} : ${error.message}`);
          }
          sets++;
          cards += rows.length;
        } catch (e) {
          errors.push(`extension ${s.id} : ${(e as Error).message}`);
        }
      }
    } catch (e) {
      errors.push(`${series.id} : ${(e as Error).message}`);
    }
  }

  revalidatePath("/collection", "layout");
  revalidatePath("/admin/catalogue");
  revalidatePath("/admin/tcgdex");

  const summary = `${collections} collection(s), ${sets} extension(s), ${cards} carte(s) importées.`;
  if (errors.length > 0) {
    return { success: summary, error: errors.slice(0, 5).join(" — ") };
  }
  return { success: summary };
}
