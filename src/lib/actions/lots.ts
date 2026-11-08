"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { toNumber, toInt } from "@/lib/utils";
import { parseRule, composeFromStock, releaseLine } from "@/lib/compose";
import type { ActionState } from "@/components/ui/Form";

export async function saveLot(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Le nom du lot est requis." };

  let rule = parseRule(null);
  try {
    rule = parseRule(formData.get("rule") ? JSON.parse(String(formData.get("rule"))) : null);
  } catch {
    /* règle invalide → vide */
  }

  const payload = {
    user_id: user.id,
    name,
    description: formData.get("description") ? String(formData.get("description")) : null,
    desired_price: toNumber(formData.get("desired_price")),
    rule: rule.slots.length > 0 ? rule : null,
  };

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase
      .from("lots")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: "Impossible de modifier le lot." };
  } else {
    const { data: lot } = await supabase.from("lots").insert(payload).select("id").single();
    if (!lot) return { error: "Impossible de créer le lot." };

    // Composition automatique.
    if (rule.slots.length > 0) {
      const { lines, picked, requested } = await composeFromStock(user.id, rule);
      for (const line of lines) {
        await supabase.from("lot_lines").insert({
          lot_id: lot.id,
          user_id: user.id,
          stock_item_id: line.stock_item_id,
          card_id: line.card_id,
          language: line.language,
          condition: line.condition,
          finish: line.finish,
          quantity: line.quantity,
          unit_cost: line.unit_cost,
        });
      }
      revalidatePath("/stock");
      revalidatePath("/lots");
      return { success: `Lot créé — ${picked}/${requested} cartes piochées depuis le stock.` };
    }
  }
  revalidatePath("/lots");
  return { success: id ? "Lot modifié." : "Lot créé." };
}

export async function addToLot(formData: FormData): Promise<void> {
  const user = await requireUser();
  const lotId = String(formData.get("lot_id") ?? "");
  const stockId = String(formData.get("stock_item_id") ?? "");
  const quantity = Math.max(1, toInt(formData.get("quantity")) ?? 1);
  const supabase = await createClient();

  const { data: stock } = await supabase
    .from("stock_items")
    .select("*")
    .eq("id", stockId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!stock) return;

  const qty = Math.min(quantity, stock.quantity);

  await supabase.from("lot_lines").insert({
    lot_id: lotId,
    user_id: user.id,
    stock_item_id: stockId,
    card_id: stock.card_id,
    language: stock.language,
    condition: stock.condition,
    finish: stock.finish,
    quantity: qty,
    unit_cost: stock.acquisition_cost,
  });

  if (stock.quantity <= qty) {
    await supabase.from("stock_items").delete().eq("id", stockId).eq("user_id", user.id);
  } else {
    await supabase
      .from("stock_items")
      .update({ quantity: stock.quantity - qty })
      .eq("id", stockId)
      .eq("user_id", user.id);
  }

  await supabase.from("stock_movements").insert({
    user_id: user.id,
    type: "Lot",
    card_id: stock.card_id,
    stock_item_id: stockId,
    quantity: qty,
    reference_type: "lot",
    reference_id: lotId,
    previous_status: stock.status,
    new_status: stock.status,
    notes: "Ajout au lot",
  });

  revalidatePath(`/lots/${lotId}`);
  revalidatePath("/stock");
  revalidatePath("/lots");
}

export async function removeLotLine(formData: FormData): Promise<void> {
  const user = await requireUser();
  const lineId = String(formData.get("line_id") ?? "");
  const supabase = await createClient();

  const { data: line } = await supabase
    .from("lot_lines")
    .select("*")
    .eq("id", lineId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!line) return;

  await releaseLine(user.id, {
    stock_item_id: line.stock_item_id,
    card_id: line.card_id,
    language: line.language,
    condition: line.condition,
    finish: line.finish,
    quantity: line.quantity,
    unit_cost: line.unit_cost,
  });

  await supabase.from("lot_lines").delete().eq("id", lineId);

  await supabase.from("stock_movements").insert({
    user_id: user.id,
    type: "Lot",
    card_id: line.card_id,
    stock_item_id: line.stock_item_id,
    quantity: line.quantity,
    reference_type: "lot",
    reference_id: line.lot_id,
    notes: "Retiré du lot",
  });

  revalidatePath(`/lots/${line.lot_id}`);
  revalidatePath("/stock");
  revalidatePath("/lots");
}

export async function setLotStatus(formData: FormData): Promise<void> {
  const user = await requireUser();
  const lotId = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const supabase = await createClient();

  await supabase.from("lots").update({ status }).eq("id", lotId).eq("user_id", user.id);

  if (status === "Annulé" || status === "Brouillon") {
    const { data: lines } = await supabase.from("lot_lines").select("*").eq("lot_id", lotId);
    for (const l of (lines ?? []) as Array<{
      stock_item_id: string | null;
      card_id: string | null;
      language: string | null;
      condition: string | null;
      finish: string | null;
      quantity: number;
      unit_cost: number | null;
    }>) {
      await releaseLine(user.id, {
        stock_item_id: l.stock_item_id,
        card_id: l.card_id,
        language: l.language,
        condition: l.condition,
        finish: l.finish,
        quantity: l.quantity,
        unit_cost: l.unit_cost,
      });
    }
  }

  revalidatePath(`/lots/${lotId}`);
  revalidatePath("/lots");
  revalidatePath("/stock");
}

export async function deleteLot(formData: FormData): Promise<void> {
  const user = await requireUser();
  const lotId = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const { data: lines } = await supabase.from("lot_lines").select("*").eq("lot_id", lotId);
  for (const l of (lines ?? []) as Array<{
    stock_item_id: string | null;
    card_id: string | null;
    language: string | null;
    condition: string | null;
    finish: string | null;
    quantity: number;
    unit_cost: number | null;
  }>) {
    await releaseLine(user.id, {
      stock_item_id: l.stock_item_id,
      card_id: l.card_id,
      language: l.language,
      condition: l.condition,
      finish: l.finish,
      quantity: l.quantity,
      unit_cost: l.unit_cost,
    });
  }
  await supabase.from("lots").delete().eq("id", lotId).eq("user_id", user.id);
  revalidatePath("/lots");
  revalidatePath("/stock");
}
