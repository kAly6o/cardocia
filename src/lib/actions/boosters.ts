"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { toNumber, toInt } from "@/lib/utils";
import { parseRule, composeFromStock, releaseLine } from "@/lib/compose";
import type { ActionState } from "@/components/ui/Form";

export async function saveRecipe(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Le nom de la recette est requis." };

  let rule = parseRule(null);
  try {
    rule = parseRule(formData.get("rule") ? JSON.parse(String(formData.get("rule"))) : null);
  } catch {
    /* règle invalide → vide */
  }
  const cardCount = rule.slots.reduce((s, x) => s + x.count, 0);

  const payload = {
    user_id: user.id,
    name,
    description: formData.get("description") ? String(formData.get("description")) : null,
    language: String(formData.get("language") ?? "FR"),
    card_count: cardCount || null,
    desired_price: toNumber(formData.get("desired_price")),
    quotas: rule,
  };

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase
      .from("booster_recipes")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: "Impossible de modifier la recette." };
  } else {
    const { error } = await supabase.from("booster_recipes").insert(payload);
    if (error) return { error: "Impossible de créer la recette." };
  }
  revalidatePath("/lots", "layout");
  return { success: id ? "Recette modifiée." : "Recette créée." };
}

export async function deleteRecipe(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("booster_recipes").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/lots", "layout");
}

export async function createBooster(formData: FormData): Promise<void> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim() || "Booster reconditionné";
  const recipeId = String(formData.get("recipe_id") ?? "") || null;
  const supabase = await createClient();

  const { data: booster } = await supabase
    .from("booster_products")
    .insert({
      user_id: user.id,
      recipe_id: recipeId,
      name,
      desired_price: toNumber(formData.get("desired_price")),
      status: "Disponible",
    })
    .select("id")
    .single();
  if (!booster) return;

  // Composition automatique depuis la recette.
  if (recipeId) {
    const { data: recipe } = await supabase
      .from("booster_recipes")
      .select("quotas")
      .eq("id", recipeId)
      .eq("user_id", user.id)
      .maybeSingle();
    const rule = parseRule(recipe?.quotas);
    if (rule.slots.length > 0) {
      const { lines } = await composeFromStock(user.id, rule);
      for (const line of lines) {
        await supabase.from("booster_lines").insert({
          booster_id: booster.id,
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
      const cost = lines.reduce((s, l) => s + (l.unit_cost ?? 0), 0);
      if (cost > 0) {
        await supabase
          .from("booster_products")
          .update({ production_cost: cost })
          .eq("id", booster.id);
      }
    }
  }

  redirect(`/boosters/${booster.id}`);
}
export async function addBoosterLine(formData: FormData): Promise<void> {
  const user = await requireUser();
  const boosterId = String(formData.get("booster_id") ?? "");
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

  await supabase.from("booster_lines").insert({
    booster_id: boosterId,
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
    type: "Booster",
    card_id: stock.card_id,
    stock_item_id: stockId,
    quantity: qty,
    reference_type: "booster",
    reference_id: boosterId,
    previous_status: stock.status,
    new_status: stock.status,
    notes: "Utilisée dans un booster",
  });

  revalidatePath(`/boosters/${boosterId}`);
  revalidatePath("/stock");
  revalidatePath("/lots", "layout");
}

export async function removeBoosterLine(formData: FormData): Promise<void> {
  const user = await requireUser();
  const lineId = String(formData.get("line_id") ?? "");
  const supabase = await createClient();

  const { data: line } = await supabase
    .from("booster_lines")
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

  await supabase.from("booster_lines").delete().eq("id", lineId);
  revalidatePath(`/boosters/${line.booster_id}`);
  revalidatePath("/stock");
  revalidatePath("/lots", "layout");
}

export async function setBoosterStatus(formData: FormData): Promise<void> {
  const user = await requireUser();
  const boosterId = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const supabase = await createClient();

  await supabase
    .from("booster_products")
    .update({ status })
    .eq("id", boosterId)
    .eq("user_id", user.id);

  if (status === "Annulé") {
    const { data: lines } = await supabase.from("booster_lines").select("*").eq("booster_id", boosterId);
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

  revalidatePath(`/boosters/${boosterId}`);
  revalidatePath("/lots", "layout");
  revalidatePath("/stock");
}

export async function deleteBooster(formData: FormData): Promise<void> {
  const user = await requireUser();
  const boosterId = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const { data: lines } = await supabase.from("booster_lines").select("*").eq("booster_id", boosterId);
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
  await supabase.from("booster_products").delete().eq("id", boosterId).eq("user_id", user.id);
  revalidatePath("/lots", "layout");
  revalidatePath("/stock");
}
