"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { toNumber, toInt } from "@/lib/utils";
import type { ActionState } from "@/components/ui/Form";

export async function saveStockItem(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const cardId = String(formData.get("card_id") ?? "");
  if (!cardId) return { error: "Sélectionnez une carte du catalogue." };

  const payload = {
    user_id: user.id,
    card_id: cardId,
    language: String(formData.get("language") ?? "FR"),
    condition: String(formData.get("condition") ?? "Near Mint"),
    finish: String(formData.get("finish") ?? "Normale"),
    acquisition_cost: toNumber(formData.get("acquisition_cost")),
    desired_price: toNumber(formData.get("desired_price")),
    estimated_value: toNumber(formData.get("estimated_value")),
    quantity: Math.max(1, toInt(formData.get("quantity")) ?? 1),
    status: String(formData.get("status") ?? "Disponible"),
    notes: formData.get("notes") ? String(formData.get("notes")) : null,
  };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase
      .from("stock_items")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: "Impossible de modifier l'article." };
  } else {
    const { error } = await supabase.from("stock_items").insert({
      ...payload,
      entered_at: new Date().toISOString().slice(0, 10),
    });
    if (error) return { error: "Impossible d'ajouter l'article." };
    await supabase.from("stock_movements").insert({
      user_id: user.id,
      type: "Ajout",
      card_id: cardId,
      quantity: payload.quantity,
      notes: "Ajout au stock à vendre",
    });
  }

  revalidatePath("/stock");
  revalidatePath("/");
  return { success: id ? "Article modifié." : "Article ajouté au stock." };
}

export async function deleteStockItem(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("stock_items")
    .select("card_id, quantity")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!item) return;

  await supabase
    .from("stock_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  await supabase.from("stock_movements").insert({
    user_id: user.id,
    type: "Correction",
    card_id: item.card_id,
    stock_item_id: id,
    quantity: item.quantity,
    notes: "Article supprimé du stock",
  });

  revalidatePath("/stock");
  revalidatePath("/");
}

export async function setStockStatus(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const target = String(formData.get("status") ?? "");
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("stock_items")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!item) return;

  // Garde-fous métier : pas de double réservation / double vente.
  if (target === "Réservé" && item.status !== "Disponible") return;
  if (target === "Vendu" && item.status !== "Disponible" && item.status !== "Réservé") return;
  if (target === "Disponible" && item.status !== "Réservé") return;

  const movementType =
    target === "Réservé"
      ? "Réservation"
      : target === "Vendu"
        ? "Vente"
        : "Libération";

  await supabase
    .from("stock_items")
    .update({ status: target })
    .eq("id", id)
    .eq("user_id", user.id);

  await supabase.from("stock_movements").insert({
    user_id: user.id,
    type: movementType,
    card_id: item.card_id,
    stock_item_id: id,
    quantity: item.quantity,
    previous_status: item.status,
    new_status: target,
    notes: `Changement de statut : ${item.status} → ${target}`,
  });

  revalidatePath("/stock");
  revalidatePath("/");
}
