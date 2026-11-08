import Link from "next/link";
import { requireUser } from "@/lib/get-user";
import { PageHeader } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/Button";
import { Button } from "@/components/ui/Button";
import { getCollectionTracker } from "@/lib/queries/collection";
import { SealedProductsList } from "@/components/sealed/SealedProductsList";
import { formatNumber, logoUrl, cn } from "@/lib/utils";

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; tab?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const tab = sp.tab === "sealed" ? "sealed" : "cards";
  const overview = await getCollectionTracker(user.id);

  const filter = sp.filter ?? "all";
  const collections =
    filter === "owned"
      ? overview.collections.filter((c) => c.ownedDistinct > 0)
      : overview.collections;

  const tabBar = (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/collection"
        className={cn(
          "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
          tab === "cards"
            ? "border-brand text-brand"
            : "border-line text-muted hover:bg-surface-2 hover:text-ink",
        )}
      >
        Cartes
      </Link>
      <Link
        href="/collection?tab=sealed"
        className={cn(
          "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
          tab === "sealed"
            ? "border-brand text-brand"
            : "border-line text-muted hover:bg-surface-2 hover:text-ink",
        )}
      >
        Produits scellés
      </Link>
    </div>
  );

  if (tab === "sealed") {
    return (
      <div className="space-y-6">
        <PageHeader title="Ma collection" description="Vos cartes et produits scellés." />
        {tabBar}
        <SealedProductsList />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ma collection"
        description="Sélectionnez une collection pour parcourir vos cartes et suivre votre progression."
      />

      {tabBar}

      <div className="flex flex-wrap gap-2">
        <Link
          href="/collection"
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
            filter === "all"
              ? "border-brand text-brand"
              : "border-line text-muted hover:bg-surface-2 hover:text-ink",
          )}
        >
          Toutes
        </Link>
        <Link
          href="/collection?filter=owned"
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
            filter === "owned"
              ? "border-brand text-brand"
              : "border-line text-muted hover:bg-surface-2 hover:text-ink",
          )}
        >
          Possédées uniquement
        </Link>
      </div>

      <Link href="/scan" className="mb-4 inline-block">
        <Button className="w-full">📷 Scanner une carte</Button>
      </Link>

      {collections.length === 0 ? (
        <EmptyState
          title="Aucune collection"
          description="Importez des séries depuis l'administration pour commencer votre suivi."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <Link
              key={c.id}
              href={`/collection/${c.id}`}
              className="panel-pad transition-colors hover:border-line-strong"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-2">
                  {logoUrl(c.logo) ? (
                    <img
                      src={logoUrl(c.logo)!}
                      alt={c.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-xl font-bold text-muted">{c.name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="truncate font-semibold text-ink">{c.name}</h2>
                    <span className="shrink-0 rounded-md border border-line bg-surface-2 px-2 py-0.5 text-xs text-muted">
                      {c.setCount} série{c.setCount > 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {formatNumber(c.ownedDistinct)} / {formatNumber(c.totalCards)} cartes
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                      <div
                        className="h-full rounded-full bg-grass"
                        style={{ width: `${c.percent}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-ink">{c.percent}%</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
