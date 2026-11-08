"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { toNumber, round2 } from "@/lib/utils";
import type { ActionState } from "@/components/ui/Form";

interface PurchaseLineInput {
  product_type: string;
  name: string;
  card_id: string | null;
  extension: string | null;
  card_number: string | null;
  language: string | null;
  condition: string | null;
  finish: string | null;
  quantity: number;
  unit_price: number;
}

export async function savePurchase(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  let lines: PurchaseLineInput[];
  try {
    lines = JSON.parse(String(formData.get("lines_json") ?? "[]"));
  } catch {
    return { error: "Données de lignes invalides." };
  }
  if (!Array.isArray(lines) || lines.length === 0) {
    return { error: "Ajoutez au moins une ligne à l'achat." };
  }

  const shipping = toNumber(formData.get("shipping_cost")) ?? 0;
  const extra = toNumber(formData.get("extra_fees")) ?? 0;
  const linesTotal = round2(
    lines.reduce((s, l) => s + (l.quantity || 0) * (toNumber(l.unit_price) ?? 0), 0),
  );
  const total = round2(linesTotal + shipping + extra);

  const header = {
    user_id: user.id,
    purchase_date: String(formData.get("purchase_date") ?? new Date().toISOString().slice(0, 10)),
    seller_name: formData.get("seller_name") ? String(formData.get("seller_name")) : null,
    reference: formData.get("reference") ? String(formData.get("reference")) : null,
    description: formData.get("description") ? String(formData.get("description")) : null,
    currency: String(formData.get("currency") ?? "EUR"),
    shipping_cost: shipping,
    extra_fees: extra,
    total,
    status: String(formData.get("status") ?? "En attente"),
    notes: formData.get("notes") ? String(formData.get("notes")) : null,
  };

  const supabase = await createClient();
  const { data: purchase, error } = await supabase
    .from("purchases")
    .insert(header)
    .select("id")
    .single();

  if (error || !purchase) return { error: "Impossible d'enregistrer l'achat." };

  const { error: linesError } = await supabase.from("purchase_lines").insert(
    lines.map((l) => ({
      purchase_id: purchase.id,
      user_id: user.id,
      product_type: l.product_type ?? "Carte",
      name: l.name ?? "",
      card_id: l.card_id || null,
      extension: l.extension || null,
      card_number: l.card_number || null,
      language: l.language || null,
      condition: l.condition || null,
      finish: l.finish || null,
      quantity: Math.max(1, l.quantity || 1),
      unit_price: toNumber(l.unit_price) ?? 0,
    })),
  );
  if (linesError) {
    await supabase.from("purchases").delete().eq("id", purchase.id);
    return { error: "Impossible d'enregistrer les lignes de l'achat." };
  }

  await supabase.from("stock_movements").insert({
    user_id: user.id,
    type: "Achat",
    quantity: lines.reduce((s, l) => s + (l.quantity || 0), 0),
    reference_type: "purchase",
    reference_id: purchase.id,
    notes: `Achat enregistré (${header.seller_name ?? "vendeur inconnu"})`,
  });

  revalidatePath("/achats");
  revalidatePath("/");
  return { success: "Achat enregistré." };
}

/** Marque un achat comme reçu et crée le stock physique pour les lignes Carte. */
export async function receivePurchase(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const destination = String(formData.get("destination") ?? "stock");
  const supabase = await createClient();

  const { data: purchase } = await supabase
    .from("purchases")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!purchase || purchase.status !== "En attente") return;

  const { data: lines } = await supabase
    .from("purchase_lines")
    .select("*")
    .eq("purchase_id", id);

  for (const l of (lines ?? []) as Array<{
    card_id: string | null;
    quantity: number;
    unit_price: number;
    language: string | null;
    condition: string | null;
    finish: string | null;
    name: string;
    product_type: string;
  }>) {
    if (!l.card_id) continue;
    const cost = toNumber(l.unit_price) ?? 0;
    if (destination === "collection") {
      await supabase.from("collection_items").insert({
        user_id: user.id,
        card_id: l.card_id,
        language: l.language ?? "FR",
        condition: l.condition ?? "Near Mint",
        finish: l.finish ?? "Normale",
        acquisition_cost: cost,
        quantity: l.quantity,
      });
    } else {
      await supabase.from("stock_items").insert({
        user_id: user.id,
        card_id: l.card_id,
        language: l.language ?? "FR",
        condition: l.condition ?? "Near Mint",
        finish: l.finish ?? "Normale",
        acquisition_cost: cost,
        quantity: l.quantity,
        status: "Disponible",
        entered_at: new Date().toISOString().slice(0, 10),
      });
    }
    await supabase.from("stock_movements").insert({
      user_id: user.id,
      type: "Réception",
      card_id: l.card_id,
      quantity: l.quantity,
      reference_type: "purchase",
      reference_id: id,
      notes: `Réception : ${l.name} (${destination})`,
    });
  }

  await supabase
    .from("purchases")
    .update({ status: "Reçu" })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath(`/achats/${id}`);
  revalidatePath("/achats");
  revalidatePath("/collection");
  revalidatePath("/stock");
  revalidatePath("/");
}

export async function deletePurchase(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("purchases").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/achats");
  revalidatePath("/");
}
