import { Brand } from "@/components/Brand";

/**
 * Écran affiché lorsque Supabase n'est pas encore configuré.
 */
export function SetupScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <h1 className="text-xl font-bold text-ink">Bienvenue dans Cardocia</h1>
          <p className="mt-2 text-sm text-muted">
            Pour démarrer, reliez l&apos;application à votre projet Supabase en
            quelques étapes.
          </p>
          <ol className="mt-6 space-y-4 text-sm text-ink">
            <Step n={1} title="Créez un projet Supabase">
              Rendez-vous sur{" "}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-fire hover:underline"
              >
                supabase.com
              </a>{" "}
              puis créez un nouveau projet (base PostgreSQL).
            </Step>
            <Step n={2} title="Renseignez les variables d'environnement">
              Dans « Project Settings → API », copiez l&apos;URL du projet, la clé{" "}
              <code className="rounded bg-surface-2 px-1 text-xs">anon</code> et la
              clé{" "}
              <code className="rounded bg-surface-2 px-1 text-xs">service_role</code>{" "}
              dans le fichier <code className="rounded bg-surface-2 px-1 text-xs">.env.local</code>.
            </Step>
            <Step n={3} title="Appliquez les migrations SQL">
              Ouvrez le SQL Editor de Supabase et exécutez le contenu de{" "}
              <code className="rounded bg-surface-2 px-1 text-xs">
                supabase/migrations/0001_initial_schema.sql
              </code>
              , ou utilisez la CLI Supabase (
              <code className="rounded bg-surface-2 px-1 text-xs">supabase db push</code>).
            </Step>
            <Step n={4} title="Redémarrez l'application">
              Relancez <code className="rounded bg-surface-2 px-1 text-xs">npm run dev</code>{" "}
              puis créez votre compte.
            </Step>
          </ol>
        </div>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-fire">
        {n}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-muted">{children}</p>
      </div>
    </li>
  );
}
