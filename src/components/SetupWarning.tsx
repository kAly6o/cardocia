/**
 * Bannière affichée lorsque la configuration Supabase est absente.
 */
export function SetupWarning() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (configured) return null;

  return (
    <div className="mb-6 w-full max-w-2xl rounded-xl border border-amber-600/40 bg-amber-900/20 p-4 text-sm text-amber-200">
      <p className="font-semibold">Configuration requise</p>
      <p className="mt-1 text-amber-100/80">
        Renseignez{" "}
        <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_SUPABASE_URL</code> et{" "}
        <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans{" "}
        <code className="rounded bg-black/30 px-1">.env.local</code>, puis appliquez les
        migrations SQL (dossier{" "}
        <code className="rounded bg-black/30 px-1">supabase/migrations</code>).
        Reportez-vous au README pour la procédure complète.
      </p>
    </div>
  );
}
