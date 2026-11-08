import { createAdminClient } from "@/lib/supabase/admin";
import { fetchTcgdex, type TcgdexSeriesSummary } from "@/lib/tcgdex";
import { PageHeader } from "@/components/ui/StatCard";
import { TcgdexImport, type TcgdexSeriesOption } from "@/components/admin/TcgdexImport";

export const dynamic = "force-dynamic";

export default async function AdminTcgdexPage() {
  let series: TcgdexSeriesSummary[] = [];
  let error: string | null = null;
  try {
    series = await fetchTcgdex<TcgdexSeriesSummary[]>("/series");
  } catch (e) {
    error = (e as Error).message;
  }

  // Collections déjà présentes en base (slug = id TCGdex).
  let imported = new Set<string>();
  if (series.length > 0) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("catalog_collections")
      .select("slug");
    imported = new Set((data ?? []).map((c) => c.slug));
  }

  const options: TcgdexSeriesOption[] = series.map((s) => ({
    id: s.id,
    name: s.name,
    imported: imported.has(s.id),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import TCGdex"
        description="Sélectionnez les séries à importer : collection, extensions et cartes (rarité + type)."
      />

      {error ? (
        <div className="rounded-xl border border-red-600/40 bg-red-900/20 px-4 py-3 text-sm text-red-300">
          Impossible de joindre l'API TCGdex : {error}
        </div>
      ) : (
        <TcgdexImport series={options} />
      )}
    </div>
  );
}
