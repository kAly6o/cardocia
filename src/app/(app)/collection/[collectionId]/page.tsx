import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/get-user";
import { PageHeader, SpaceBanner } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/Button";
import { getCollection } from "@/lib/queries/catalogue";
import { getSetTracker } from "@/lib/queries/collection";
import { toggleTrackSet } from "@/lib/actions/collection";
import { formatNumber, logoUrl, cn } from "@/lib/utils";
import { LogoImage } from "@/components/cards/LogoImage";
import { ArrowLeft, Star } from "lucide-react";

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
      <SpaceBanner label="Ma collection" accent="#22c55e" />
      <PageHeader
        title={collection.name}
        description="Extensions de cette collection — suivez celles que vous collectionnez."
        actions={
          <Link href="/collection" className="text-sm text-muted transition-colors hover:text-ink">
            <ArrowLeft className="mr-1 inline-block h-3.5 w-3.5 align-[-2px]" />Suivi
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((s) => (
            <div
              key={s.id}
              className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-all hover:-translate-y-0.5 hover:border-grass/50 hover:shadow-float"
            >
              <div className="flex h-28 items-center justify-center border-b border-line bg-logo-bg p-4 sm:h-36">
                <LogoImage
                  src={logoUrl(s.logo)}
                  alt={s.name}
                  fallback={s.name.charAt(0)}
                  className="h-full w-full object-contain"
                  fallbackClassName="h-16 w-16 text-2xl"
                />
              </div>
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Link
                      href={`/collection/set/${s.id}`}
                      className="truncate font-semibold text-ink transition-colors hover:text-brand"
                    >
                      {s.name}
                    </Link>
                    {s.abbreviation && (
                      <span className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                        {s.abbreviation}
                      </span>
                    )}
                  </div>
                  <form action={toggleTrackSet}>
                    <input type="hidden" name="set_id" value={s.id} />
                    <button
                      type="submit"
                      className={cn(
                        "shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
                        s.tracked
                          ? "border-brand/60 bg-brand/10 text-brand"
                          : "border-line text-muted hover:bg-surface-2 hover:text-ink",
                      )}
                    >
                      {s.tracked ? <><Star className="mr-1 inline-block h-3 w-3 align-[-2px]" />Suivie</> : "Suivre"}
                    </button>
                  </form>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {formatNumber(s.ownedDistinct)} / {formatNumber(s.card_count ?? 0)} cartes ·{" "}
                  {formatNumber(s.ownedQuantity)} ex.
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full bg-grass"
                      style={{ width: `${s.percent}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-ink">{s.percent}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
