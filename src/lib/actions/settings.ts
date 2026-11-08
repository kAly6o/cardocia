"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/components/ui/Form";

export async function savePlatforms(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const text = String(formData.get("platforms") ?? "");
  const platforms = text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("settings")
    .eq("id", user.id)
    .maybeSingle();

  const settings = {
    ...((profile?.settings as Record<string, unknown>) ?? {}),
    platforms,
  };

  const { error } = await supabase
    .from("profiles")
    .update({ settings })
    .eq("id", user.id);
  if (error) return { error: "Impossible d'enregistrer les plateformes." };

  revalidatePath("/parametres");
  return { success: "Plateformes enregistrées." };
}
