"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { toNumber, toInt } from "@/lib/utils";
import type { ActionState } from "@/components/ui/Form";

export async function saveSealedProduct(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Le nom du produit est requis." };

  const payload = {
    user_id: user.id,
    name,
    product_type: String(formData.get("product_type") ?? "Booster"),
    set_id: String(formData.get("set_id") ?? "") || null,
    language: String(formData.get("language") ?? "FR"),
    quantity: Math.max(0, toInt(formData.get("quantity")) ?? 1),
    purchase_price: toNumber(formData.get("purchase_price")),
    estimated_value: toNumber(formData.get("estimated_value")),
    condition: String(formData.get("condition") ?? "Neuf"),
    purchase_date: formData.get("purchase_date") ? String(formData.get("purchase_date")) : null,
    notes: formData.get("notes") ? String(formData.get("notes")) : null,
  };

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase
      .from("sealed_products")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: "Impossible de modifier le produit." };
  } else {
    const { error } = await supabase.from("sealed_products").insert(payload);
    if (error) return { error: "Impossible d'ajouter le produit." };
  }
  revalidatePath("/produits");
  revalidatePath("/collection", "layout");
  return { success: id ? "Produit modifié." : "Produit ajouté." };
}

export async function deleteSealedProduct(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("sealed_products").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/produits");
  revalidatePath("/collection", "layout");
}

export async function openProduct(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const qty = Math.max(1, toInt(formData.get("quantity")) ?? 1);
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("sealed_products")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!product || product.quantity <= 0) return;

  const openQty = Math.min(qty, product.quantity);

  const { data: opening } = await supabase
    .from("product_openings")
    .insert({
      user_id: user.id,
      sealed_product_id: id,
      quantity_opened: openQty,
      allocated_cost:
        product.purchase_price != null ? product.purchase_price * openQty : null,
    })
    .select("id")
    .single();

  if (!opening) return;

  await supabase
    .from("sealed_products")
    .update({ quantity: product.quantity - openQty })
    .eq("id", id);

  await supabase.from("stock_movements").insert({
    user_id: user.id,
    type: "Ouverture",
    quantity: openQty,
    reference_type: "opening",
    reference_id: opening.id,
    notes: `Ouverture : ${product.name}`,
  });

  redirect(`/produits/ouverture/${opening.id}`);
}

export async function addOpeningLine(formData: FormData): Promise<void> {
  const user = await requireUser();
  const openingId = String(formData.get("opening_id") ?? "");
  const cardId = String(formData.get("card_id") ?? "");
  if (!cardId) return;

  const destination = String(formData.get("destination") ?? "collection");
  const quantity = Math.max(1, toInt(formData.get("quantity")) ?? 1);
  const language = String(formData.get("language") ?? "FR");
  const condition = String(formData.get("condition") ?? "Near Mint");
  const finish = String(formData.get("finish") ?? "Normale");

  const supabase = await createClient();

  await supabase.from("product_opening_lines").insert({
    opening_id: openingId,
    user_id: user.id,
    card_id: cardId,
    destination,
    quantity,
    language,
    condition,
    finish,
  });

  if (destination === "collection") {
    await supabase.from("collection_items").insert({
      user_id: user.id,
      card_id: cardId,
      language,
      condition,
      finish,
      quantity,
    });
  } else {
    await supabase.from("stock_items").insert({
      user_id: user.id,
      card_id: cardId,
      language,
      condition,
      finish,
      quantity,
      status: "Disponible",
      entered_at: new Date().toISOString().slice(0, 10),
    });
  }

  await supabase.from("stock_movements").insert({
    user_id: user.id,
    type: "Ouverture",
    card_id: cardId,
    quantity,
    reference_type: "opening",
    reference_id: openingId,
    notes: `Carte obtenue (${destination})`,
  });

  revalidatePath(`/produits/ouverture/${openingId}`);
  revalidatePath("/collection");
  revalidatePath("/stock");
}
