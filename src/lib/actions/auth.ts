"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/get-user";
import type { ActionState } from "@/components/ui/Form";

function authError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "E-mail ou mot de passe incorrect.";
  }
  if (m.includes("already registered")) {
    return "Un compte existe déjà avec cette adresse e-mail.";
  }
  if (m.includes("email not confirmed")) {
    return "Veuillez confirmer votre adresse e-mail avant de vous connecter.";
  }
  if (m.includes("password should be at least")) {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Trop de tentatives. Réessayez dans quelques instants.";
  }
  if (m.includes("new password should be different")) {
    return "Le nouveau mot de passe doit être différent de l'ancien.";
  }
  return message;
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function signIn(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/");

  if (!email || !password) {
    return { error: "Veuillez renseigner votre e-mail et votre mot de passe." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: authError(error.message) };

  redirect(redirectTo.startsWith("/") ? redirectTo : "/");
}

export async function signUp(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!email || !password) {
    return { error: "Veuillez renseigner un e-mail et un mot de passe." };
  }
  if (password.length < 6) {
    return { error: "Le mot de passe doit contenir au moins 6 caractères." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${siteUrl()}/auth/callback`,
    },
  });

  if (error) return { error: authError(error.message) };

  return {
    success:
      "Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.",
  };
}

export async function requestPasswordReset(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Veuillez renseigner votre adresse e-mail." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/reset-password`,
  });
  if (error) return { error: authError(error.message) };

  return {
    success:
      "Si un compte existe avec cette adresse, un e-mail de réinitialisation vient d'être envoyé.",
  };
}

export async function updatePassword(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) {
    return { error: "Le mot de passe doit contenir au moins 6 caractères." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: authError(error.message) };

  return { success: "Mot de passe mis à jour." };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateProfile(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const defaultCurrency = String(formData.get("default_currency") ?? "EUR");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, default_currency: defaultCurrency })
    .eq("id", user.id);

  if (error) return { error: "Impossible d'enregistrer le profil." };

  return { success: "Profil mis à jour." };
}
