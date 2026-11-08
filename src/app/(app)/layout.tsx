import { AppShell } from "@/components/layout/AppShell";
import { SetupScreen } from "@/components/SetupScreen";
import { getCurrentUser } from "@/lib/get-user";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Toutes les pages de l'application dépendent de la session utilisateur
// (cookies) et de données en base : rendu dynamique, pas de pré-rendu.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    // Configuration Supabase absente → écran d'installation.
    return <SetupScreen />;
  }

  if (!user) redirect("/login");

  let fullName: string | null = null;
  let isAdmin = false;
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, is_admin")
      .eq("id", user.id)
      .maybeSingle();
    fullName = profile?.full_name ?? null;
    isAdmin = profile?.is_admin ?? false;
  } catch {
    // Le profil peut ne pas exister encore ; non bloquant.
  }

  return (
    <AppShell email={user.email ?? null} fullName={fullName} isAdmin={isAdmin}>
      {children}
    </AppShell>
  );
}
