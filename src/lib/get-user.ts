import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "./supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Récupère l'utilisateur connecté (mise en cache par requête).
 * Retourne `null` si aucune session valide.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
});

/**
 * Exige un utilisateur connecté : redirige vers /login sinon.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Indique si l'utilisateur connecté est administrateur.
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    return Boolean(data?.is_admin);
  } catch {
    return false;
  }
}

/**
 * Exige un administrateur connecté : redirige vers l'accueil sinon.
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!(await isAdmin())) redirect("/");
  return user;
}
