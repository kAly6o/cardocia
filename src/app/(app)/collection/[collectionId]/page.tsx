import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/get-user";
import { PageHeader } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/Button";
import { getCollection } from "@/lib/queries/catalogue";
import { getSetTracker } from "@/lib/queries/collection";
import { toggleTrackSet } from "@/lib/actions/collection";
import { formatNumber, logoUrl, cn } from "@/lib/utils";

export default async function CollectionSetsPage({
  params,
  searchParams,
}: {
  params: Promise<{ collectionId: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await requireUser();
  const { collectionId } = await params;
  const sp = await searchParams;
  const collection = await getCollection(collectionId);
  if (!collection) notFound();

  const sets = await getSetTracker(user.id, collectionId);
  const filter = sp.filter ?? "all";
  const visible = filter === "tracked" ? sets.filter((s) => s.tracked) : sets;

  const filterLink = (href: string, active: boolean, label: string) => (
    <Link
      href={href}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-brand text-brand"
          : "border-line text-muted hover:bg-surface-2 hover:text-ink",
      )}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={collection.name}
        description="Extensions de cette collection — suivez celles que vous collectionnez."
        actions={
          <Link href="/collection" className="text-sm text-muted transition-colors hover:text-ink">
            ← Suivi
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        {filterLink(`/collection/${collectionId}`, filter === "all", "Toutes")}
        {filterLink(
          `/collection/${collectionId}?filter=tracked`,
          filter === "tracked",
          "Suivies uniquement",
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Aucune extension"
          description="Aucune extension à afficher avec ce filtre."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((s) => (
            <div key={s.id} className="panel-pad">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-2">
                  {logoUrl(s.logo) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl(s.logo)!} alt={s.name} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-lg font-bold text-muted">{s.name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/collection/set/${s.id}`}
                      className="min-w-0 truncate font-semibold text-ink transition-colors hover:text-fire"
                    >
                      {s.name}
                    </Link>
                    <form action={toggleTrackSet}>
                      <input type="hidden" name="set_id" value={s.id} />
                      <button
                        type="submit"
                        className={cn(
                          "shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
                          s.tracked
                            ? "border-brand text-brand"
                            : "border-line text-muted hover:bg-surface-2 hover:text-ink",
                        )}
                      >
                        {s.tracked ? "★ Suivie" : "Suivre"}
                      </button>
                    </form>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {formatNumber(s.ownedDistinct)} / {formatNumber(s.card_count ?? 0)} cartes ·{" "}
                    {formatNumber(s.ownedQuantity)} ex.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                      <div
                        className="h-full rounded-full bg-grass"
                        style={{ width: `${s.percent}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-ink">{s.percent}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
