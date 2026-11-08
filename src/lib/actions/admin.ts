"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/get-user";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionState } from "@/components/ui/Form";
import { slugify, toInt } from "@/lib/utils";

/** Garde d'accès commune : exige un admin + renvoie le client service_role. */
async function adminClient() {
  await requireAdmin();
  return createAdminClient();
}

function strOrNull(value: FormDataEntryValue | null): string | null {
  if (value === null) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

// ---------------------------------------------------------------------------
// Catalogue — collections
// ---------------------------------------------------------------------------

export async function saveCollection(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await adminClient();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim() || slugify(name);
  if (!name) return { error: "Le nom de la collection est requis." };
  if (!slug) return { error: "L'identifiant (slug) est requis." };

  const payload = {
    name,
    slug,
    description: strOrNull(formData.get("description")),
    logo: strOrNull(formData.get("logo")),
    sort_order: toInt(formData.get("sort_order")) ?? 0,
  };

  const { error } = id
    ? await supabase.from("catalog_collections").update(payload).eq("id", id)
    : await supabase.from("catalog_collections").insert(payload);

  if (error) {
    if (/unique/i.test(error.message)) {
      return { error: "Cet identifiant (slug) est déjà utilisé." };
    }
    return { error: "Impossible d'enregistrer la collection." };
  }

  revalidatePath("/admin/catalogue");
  return { success: id ? "Collection modifiée." : "Collection ajoutée." };
}

export async function deleteCollection(formData: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(formData.get("id") ?? "");
  await supabase.from("catalog_collections").delete().eq("id", id);
  revalidatePath("/admin/catalogue");
}

// ---------------------------------------------------------------------------
// Catalogue — extensions
// ---------------------------------------------------------------------------

export async function saveSet(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await adminClient();
  const id = String(formData.get("id") ?? "");
  const collectionId = String(formData.get("collection_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Le nom de l'extension est requis." };
  if (!collectionId) return { error: "La collection est requise." };

  const payload = {
    collection_id: collectionId,
    name,
    original_name: strOrNull(formData.get("original_name")),
    external_id: strOrNull(formData.get("external_id")),
    symbol: strOrNull(formData.get("symbol")),
    logo: strOrNull(formData.get("logo")),
    release_date: strOrNull(formData.get("release_date")),
    card_count: toInt(formData.get("card_count")),
  };

  const { error } = id
    ? await supabase.from("catalog_sets").update(payload).eq("id", id)
    : await supabase.from("catalog_sets").insert(payload);

  if (error) return { error: "Impossible d'enregistrer l'extension." };

  revalidatePath("/admin/catalogue");
  return { success: id ? "Extension modifiée." : "Extension ajoutée." };
}

export async function deleteSet(formData: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(formData.get("id") ?? "");
  await supabase.from("catalog_sets").delete().eq("id", id);
  revalidatePath("/admin/catalogue");
}

// ---------------------------------------------------------------------------
// Catalogue — cartes
// ---------------------------------------------------------------------------

export async function saveCard(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await adminClient();
  const id = String(formData.get("id") ?? "");
  const setId = String(formData.get("set_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const number = String(formData.get("number") ?? "").trim();
  if (!name) return { error: "Le nom de la carte est requis." };
  if (!number) return { error: "Le numéro de la carte est requis." };
  if (!setId) return { error: "L'extension est requise." };

  const payload = {
    set_id: setId,
    name,
    number,
    external_id: strOrNull(formData.get("external_id")),
    image: strOrNull(formData.get("image")),
    rarity: strOrNull(formData.get("rarity")),
    pokemon_type: strOrNull(formData.get("pokemon_type")),
    illustrator: strOrNull(formData.get("illustrator")),
    description: strOrNull(formData.get("description")),
  };

  const { error } = id
    ? await supabase.from("catalog_cards").update(payload).eq("id", id)
    : await supabase.from("catalog_cards").insert(payload);

  if (error) return { error: "Impossible d'enregistrer la carte." };

  revalidatePath("/admin/catalogue");
  return { success: id ? "Carte modifiée." : "Carte ajoutée." };
}

export async function deleteCard(formData: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(formData.get("id") ?? "");
  await supabase.from("catalog_cards").delete().eq("id", id);
  revalidatePath("/admin/catalogue");
}

// ---------------------------------------------------------------------------
// Utilisateurs
// ---------------------------------------------------------------------------

export async function setUserAdmin(formData: FormData): Promise<void> {
  const supabase = await adminClient();
  const current = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const admin = formData.get("admin") === "true";
  // Évite de se rétrograder soi-même (sinon perte d'accès à l'espace admin).
  if (!admin && id === current.id) return;
  await supabase.from("profiles").update({ is_admin: admin }).eq("id", id);
  revalidatePath("/admin/utilisateurs");
  revalidatePath("/admin");
}

export async function banUser(formData: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(formData.get("id") ?? "");
  const ban = formData.get("ban") === "true";
  // "876600h" ≈ 100 ans : bannissement effectif sans durée limite arbitraire.
  await supabase.auth.admin.updateUserById(id, {
    ban_duration: ban ? "876600h" : "none",
  });
  revalidatePath("/admin/utilisateurs");
}
