import Link from "next/link";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/StatCard";
import { ProfileForm, PlatformsForm } from "@/components/settings/SettingsForms";

export default async function SettingsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const settings = (profile?.settings as Record<string, unknown> | null) ?? {};
  const platforms = Array.isArray(settings.platforms)
    ? (settings.platforms as string[])
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Gérez votre profil et les options de l'application."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel-pad">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Profil
          </h2>
          <ProfileForm
            fullName={profile?.full_name ?? null}
            defaultCurrency={profile?.default_currency ?? "EUR"}
          />
          <p className="mt-4 text-sm text-muted">
            Adresse e-mail : <span className="text-ink">{user.email ?? "—"}</span>
          </p>
          <p className="mt-2 text-sm text-muted">
            Pour changer de mot de passe,{" "}
            <Link href="/forgot-password" className="text-fire hover:underline">
              demandez un lien de réinitialisation
            </Link>
            .
          </p>
        </section>

        <section className="panel-pad">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Plateformes de vente
          </h2>
          <PlatformsForm platforms={platforms} />
        </section>
      </div>
    </div>
  );
}
