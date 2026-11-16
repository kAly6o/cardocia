"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { parseCsv } from "@/lib/csv";
import { toNumber } from "@/lib/utils";
import { getImportFields, type ImportType } from "@/lib/import-mapping";
import type { ActionState } from "@/components/ui/Form";

const TYPES: ImportType[] = ["achats", "ventes", "inventaire"];

export interface ImportSummary {
  totalRows: number;
  imported: number;
  duplicates: number;
  errors: number;
}

function norm(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function importCsv(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState & { summary?: ImportSummary }> {
  const user = await requireUser();

  const type = String(formData.get("type") ?? "") as ImportType;
  if (!TYPES.includes(type)) return { error: "Type d'import invalide." };

  const platform = String(formData.get("platform") ?? "").trim() || "Cardmarket";
  const currency = String(formData.get("currency") ?? "EUR");

  let mapping: Record<string, string>;
  try {
    mapping = JSON.parse(String(formData.get("mapping") ?? "{}"));
  } catch {
    return { error: "Correspondance des colonnes invalide." };
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") return { error: "Fichier CSV manquant." };
  const text = await file.text();
  const parsed = parseCsv(text);
  if (parsed.headers.length === 0 || parsed.rows.length === 0) {
    return { error: "Fichier CSV vide ou illisible." };
  }

  const fields = getImportFields(type);
  const indexFor: Record<string, number> = {};
  for (const f of fields) {
    const header = mapping[f.key];
    if (!header) continue;
    const idx = parsed.headers.indexOf(header);
    if (idx >= 0) indexFor[f.key] = idx;
  }

  const missing = fields.filter((f) => f.required && indexFor[f.key] === undefined);
  if (missing.length) {
    return {
      error: `Colonne(s) requise(s) manquante(s) : ${missing.map((f) => f.label).join(", ")}.`,
    };
  }

  const supabase = await createClient();

  const { data: existingRefs } = await supabase
    .from("imported_transactions")
    .select("external_ref")
    .eq("user_id", user.id)
    .eq("platform", platform)
    .eq("import_type", type);
  const seenRefs = new Set((existingRefs ?? []).map((r) => r.external_ref));

  const [setsRes, cardsRes] = await Promise.all([
    supabase.from("catalog_sets").select("id, external_id, name"),
    supabase.from("catalog_cards").select("id, set_id, number, name"),
  ]);
  const setsByCode = new Map<string, string>();
  const setsByName = new Map<string, string>();
  for (const s of (setsRes.data ?? []) as { id: string; external_id: string | null; name: string }[]) {
    if (s.external_id) setsByCode.set(norm(s.external_id), s.id);
    setsByName.set(norm(s.name), s.id);
  }
  const cardsBySet = new Map<string, { id: string; number: string }[]>();
  for (const c of (cardsRes.data ?? []) as { id: string; set_id: string; number: string }[]) {
    const arr = cardsBySet.get(c.set_id) ?? [];
    arr.push(c);
    cardsBySet.set(c.set_id, arr);
  }

  function resolveCardId(name: string, extension: string, number: string): string | null {
    const extNorm = norm(extension);
    let setId = setsByCode.get(extNorm) ?? setsByName.get(extNorm) ?? null;
    if (!setId && extNorm) {
      for (const [setName, id] of setsByName) {
        if (setName.includes(extNorm) || extNorm.includes(setName)) {
          setId = id;
          break;
        }
      }
    }
    const num = norm((number || "").split("/")[0]);
    if (!setId || !num || !cardsBySet.has(setId)) return null;
    const matches = cardsBySet.get(setId)!.filter((c) => norm(c.number) === num);
    return matches.length === 1 ? matches[0].id : null;
  }
const { data: batch, error: batchErr } = await supabase
    .from("import_batches")
    .insert({
      user_id: user.id,
      platform,
      import_type: type,
      file_name: file.name,
      total_rows: parsed.rows.length,
    })
    .select("id")
    .single();
  if (batchErr || !batch) return { error: "Impossible d'initialiser l'import." };

  let imported = 0;
  let duplicates = 0;
  let errors = 0;
  const transactions: Record<string, unknown>[] = [];

  for (let i = 0; i < parsed.rows.length; i++) {
    const row = parsed.rows[i];
    const get = (k: string) =>
      indexFor[k] !== undefined ? (row[indexFor[k]] ?? "").trim() : "";
    const reference = get("reference");
    const externalRef = reference || `${type}-ligne-${i + 1}`;

    if (seenRefs.has(externalRef)) {
      duplicates++;
      transactions.push({
        user_id: user.id,
        batch_id: batch.id,
        platform,
        import_type: type,
        external_ref: externalRef,
        status: "doublon",
        raw: row,
        message: "Référence déjà importée.",
      });
      continue;
    }

    try {
      let linkedPurchase: string | null = null;
      let linkedSale: string | null = null;

      if (type === "achats") {
        const qty = Math.max(1, toNumber(get("quantity")) ?? 1);
        const unitPrice = toNumber(get("unit_price")) ?? 0;
        const total = toNumber(get("total")) ?? qty * unitPrice;
        const { data: purchase, error } = await supabase
          .from("purchases")
          .insert({
            user_id: user.id,
            purchase_date: get("purchase_date") || new Date().toISOString().slice(0, 10),
            seller_name: get("seller_name") || null,
            reference: reference || null,
            description: get("description") || null,
            currency: get("currency") || currency,
            shipping_cost: toNumber(get("shipping_cost")),
            extra_fees: toNumber(get("extra_fees")),
            total,
            status: "En attente",
            external_ref: externalRef,
            source: "import",
          })
          .select("id")
          .single();
        if (error || !purchase) throw new Error("Échec de l'enregistrement de l'achat.");
        linkedPurchase = purchase.id;
        const name = get("name") || "Article";
        await supabase.from("purchase_lines").insert({
          purchase_id: purchase.id,
          user_id: user.id,
          card_id: resolveCardId(name, get("extension"), get("card_number")),
          product_type: "Carte",
          name,
          extension: get("extension") || null,
          card_number: get("card_number") || null,
          language: get("language") || "FR",
          condition: get("condition") || "Near Mint",
          finish: get("finish") || "Normale",
          quantity: qty,
          unit_price: unitPrice,
        });
      } else if (type === "ventes") {
        const qty = Math.max(1, toNumber(get("quantity")) ?? 1);
        const unitPrice = toNumber(get("unit_price")) ?? 0;
        const fees = toNumber(get("fees")) ?? 0;
        const shipping = toNumber(get("shipping_fees")) ?? 0;
        const amountReceived = toNumber(get("amount_received")) ?? qty * unitPrice;
        const profit = toNumber(get("profit")) ?? amountReceived - fees - shipping;
        const { data: sale, error } = await supabase
          .from("sales")
          .insert({
            user_id: user.id,
            sale_date: get("sale_date") || new Date().toISOString().slice(0, 10),
            platform: get("platform") || platform,
            reference: reference || null,
            buyer: get("buyer") || null,
            currency: get("currency") || currency,
            fees,
            shipping_fees: shipping,
            amount_received: amountReceived,
            cost_of_goods: 0,
            profit,
            status: "Validée",
            external_ref: externalRef,
            source: "import",
          })
          .select("id")
          .single();
        if (error || !sale) throw new Error("Échec de l'enregistrement de la vente.");
        linkedSale = sale.id;
        const name = get("name") || "Article";
        await supabase.from("sale_lines").insert({
          sale_id: sale.id,
          user_id: user.id,
          card_id: resolveCardId(name, get("extension"), get("card_number")),
          product_type: "Carte",
          name,
          quantity: qty,
          unit_price: unitPrice,
        });
      } else {
const name = get("name");
        const cardId = resolveCardId(name, get("extension"), get("card_number"));
        if (!cardId) {
          throw new Error(`Carte non identifiée : ${name || "(sans nom)"}`);
        }
        await supabase.from("collection_items").insert({
          user_id: user.id,
          card_id: cardId,
          language: get("language") || "FR",
          condition: get("condition") || "Near Mint",
          finish: get("finish") || "Normale",
          quantity: Math.max(1, toNumber(get("quantity")) ?? 1),
          acquisition_cost: toNumber(get("acquisition_cost")),
          estimated_value: toNumber(get("estimated_value")),
          acquisition_date: get("acquisition_date") || null,
          location: get("location") || null,
        });
      }

      imported++;
      seenRefs.add(externalRef);
      transactions.push({
        user_id: user.id,
        batch_id: batch.id,
        platform,
        import_type: type,
        external_ref: externalRef,
        status: "importée",
        raw: row,
        linked_purchase_id: linkedPurchase,
        linked_sale_id: linkedSale,
      });
    } catch (e) {
      errors++;
      transactions.push({
        user_id: user.id,
        batch_id: batch.id,
        platform,
        import_type: type,
        external_ref: externalRef,
        status: "erreur",
        raw: row,
        message: e instanceof Error ? e.message : "Erreur inconnue",
      });
    }
  }

  if (transactions.length > 0) {
    await supabase.from("imported_transactions").insert(transactions);
  }
  await supabase
    .from("import_batches")
    .update({ imported_rows: imported, duplicate_rows: duplicates, error_rows: errors })
    .eq("id", batch.id);

  await revalidatePath("/import");
  if (type === "achats") await revalidatePath("/achats");
  if (type === "ventes") await revalidatePath("/ventes");
  if (type === "inventaire") {
    await revalidatePath("/collection");
    await revalidatePath("/");
  }

  return {
    success: `Import terminé : ${imported} importé(s), ${duplicates} doublon(s), ${errors} erreur(s).`,
    summary: { totalRows: parsed.rows.length, imported, duplicates, errors },
  };
}