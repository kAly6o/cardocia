"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { toNumber, toInt } from "@/lib/utils";
import type { ActionState } from "@/components/ui/Form";

export async function saveCollectionItem(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const cardId = String(formData.get("card_id") ?? "");
  if (!cardId) return { error: "Sélectionnez une carte du catalogue." };

  const quantity = Math.max(1, toInt(formData.get("quantity")) ?? 1);
  const payload = {
    user_id: user.id,
    card_id: cardId,
    language: String(formData.get("language") ?? "FR"),
    condition: String(formData.get("condition") ?? "Near Mint"),
    finish: String(formData.get("finish") ?? "Normale"),
    quantity,
    acquisition_cost: toNumber(formData.get("acquisition_cost")),
    estimated_value: toNumber(formData.get("estimated_value")),
    acquisition_date: formData.get("acquisition_date")
      ? String(formData.get("acquisition_date"))
      : null,
    notes: formData.get("notes") ? String(formData.get("notes")) : null,
    location: formData.get("location") ? String(formData.get("location")) : null,
  };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase
      .from("collection_items")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: "Impossible de modifier l'exemplaire." };
  } else {
    const { error } = await supabase.from("collection_items").insert(payload);
    if (error) return { error: "Impossible d'ajouter l'exemplaire." };
    await supabase.from("stock_movements").insert({
      user_id: user.id,
      type: "Ajout",
      card_id: cardId,
      quantity,
      notes: "Ajout à la collection",
    });
  }

  revalidatePath("/collection", "layout");
  revalidatePath("/");
  return { success: id ? "Exemplaire modifié." : "Exemplaire ajouté à la collection." };
}

export async function quickAddCard(formData: FormData): Promise<void> {
  const user = await requireUser();
  const cardId = String(formData.get("card_id") ?? "");
  const finish = String(formData.get("finish") ?? "Normale");
  if (!cardId) return;
  const supabase = await createClient();

  // Exemplaire "par défaut" (FR / Near Mint) : incrémente s'il existe, sinon crée.
  const { data: existing } = await supabase
    .from("collection_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("card_id", cardId)
    .eq("language", "FR")
    .eq("condition", "Near Mint")
    .eq("finish", finish)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("collection_items")
      .update({ quantity: (existing.quantity ?? 0) + 1 })
      .eq("id", existing.id);
  } else {
    await supabase.from("collection_items").insert({
      user_id: user.id,
      card_id: cardId,
      language: "FR",
      condition: "Near Mint",
      finish,
      quantity: 1,
    });
  }

  await supabase.from("stock_movements").insert({
    user_id: user.id,
    type: "Ajout",
    card_id: cardId,
    quantity: 1,
    notes: "Ajout rapide à la collection",
  });

  revalidatePath("/collection", "layout");
  revalidatePath("/");
}

export async function deleteCollectionItem(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("collection_items")
    .select("card_id, quantity")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!item) return;

  await supabase
    .from("collection_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  await supabase.from("stock_movements").insert({
    user_id: user.id,
    type: "Correction",
    card_id: item.card_id,
    collection_item_id: id,
    quantity: item.quantity,
    notes: "Exemplaire supprimé de la collection",
  });

  revalidatePath("/collection", "layout");
  revalidatePath("/");
}

export async function transferToStock(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("collection_items")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!item) return;

  const transferQty = Math.min(
    Math.max(1, toInt(formData.get("quantity")) ?? 1),
    item.quantity,
  );

  await supabase.from("stock_items").insert({
    user_id: user.id,
    card_id: item.card_id,
    collection_item_id: id,
    language: item.language,
    condition: item.condition,
    finish: item.finish,
    acquisition_cost: item.acquisition_cost,
    estimated_value: item.estimated_value,
    quantity: transferQty,
    status: "Disponible",
    entered_at: new Date().toISOString().slice(0, 10),
  });

  if (transferQty >= item.quantity) {
    await supabase
      .from("collection_items")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("collection_items")
      .update({ quantity: item.quantity - transferQty })
      .eq("id", id)
      .eq("user_id", user.id);
  }

  await supabase.from("stock_movements").insert({
    user_id: user.id,
    type: "Transfert",
    card_id: item.card_id,
    collection_item_id: id,
    quantity: transferQty,
    previous_status: "collection",
    new_status: "stock",
    notes: "Transfert vers le stock à vendre",
  });

  revalidatePath("/collection", "layout");
  revalidatePath("/stock");
  revalidatePath("/");
}

export async function toggleTrackSet(formData: FormData): Promise<void> {
  const user = await requireUser();
  const setId = String(formData.get("set_id") ?? "");
  if (!setId) return;
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("tracked_sets")
    .select("set_id")
    .eq("user_id", user.id)
    .eq("set_id", setId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("tracked_sets")
      .delete()
      .eq("user_id", user.id)
      .eq("set_id", setId);
  } else {
    await supabase.from("tracked_sets").insert({ user_id: user.id, set_id: setId });
  }

  revalidatePath("/collection", "layout");
  revalidatePath("/");
}
