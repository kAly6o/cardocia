import { requireUser } from "@/lib/get-user";
import { PageHeader, SpaceBanner } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/Button";
import Link from "next/link";
import { cn, logoUrl, formatNumber } from "@/lib/utils";
import { LogoImage } from "@/components/cards/LogoImage";
import { getStockCollectionTracker } from "@/lib/queries/stock";

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const filter = sp.filter ?? "all";

  const { collections: collectionsOut, totalStockItems, available } =
    await getStockCollectionTracker(user.id);

  const collections =
    filter === "owned"
      ? collectionsOut.filter((c) => c.inStockQuantity > 0)
      : collectionsOut;

  const tabBar = (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/stock"
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
        href="/stock?filter=owned"
        className={cn(
          "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
          filter === "owned"
            ? "border-brand text-brand"
            : "border-line text-muted hover:bg-surface-2 hover:text-ink",
        )}
      >
        En stock uniquement
      </Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <SpaceBanner label="Stock à vendre" accent="#f97316" />
      <PageHeader
        title="Stock à vendre"
        description={`${totalStockItems} article${totalStockItems > 1 ? "s" : ""} · ${available} disponible${available > 1 ? "s" : ""}.`}
      />

      {tabBar}

      {collections.length === 0 ? (
        <EmptyState
          title="Aucune collection en stock"
          description="Ajoutez des cartes à vendre depuis le catalogue ou transférez-les depuis votre collection."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {collections.map((c) => (
            <Link
              key={c.id}
              href={`/stock/${c.id}`}
              className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-accent/50 hover:shadow-float"
            >
              <div className="flex h-28 items-center justify-center border-b border-line bg-logo-bg p-4 sm:h-36">
                <LogoImage
                  src={logoUrl(c.logo)}
                  alt={c.name}
                  fallback={c.name.charAt(0)}
                  className="h-full w-full object-contain"
                  fallbackClassName="h-16 w-16 text-2xl"
                />
              </div>
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="min-w-0 truncate font-semibold text-ink">{c.name}</h2>
                  <span className="shrink-0 rounded-md border border-brand-accent/30 bg-brand-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-accent">
                    {c.setCount} série{c.setCount > 1 ? "s" : ""}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {formatNumber(c.inStockDistinct)} carte{c.inStockDistinct > 1 ? "s" : ""} ·{" "}
                  {formatNumber(c.inStockQuantity)} exemplaire{c.inStockQuantity > 1 ? "s" : ""} en stock
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
