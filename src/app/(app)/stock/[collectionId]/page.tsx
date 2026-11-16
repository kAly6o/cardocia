import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/get-user";
import { PageHeader, SpaceBanner } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/Button";
import { getCollection } from "@/lib/queries/catalogue";
import { getStockSetTracker } from "@/lib/queries/stock";
import { formatNumber, logoUrl, cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { LogoImage } from "@/components/cards/LogoImage";

export default async function StockCollectionPage({
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

  const sets = await getStockSetTracker(user.id, collectionId);
  const filter = sp.filter ?? "all";
  const visible =
    filter === "owned" ? sets.filter((s) => s.inStockQuantity > 0) : sets;

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
      <SpaceBanner label="Stock à vendre" accent="#f97316" />
      <PageHeader
        title={collection.name}
        description="Extensions de cette collection en stock."
        actions={
          <Link
            href="/stock"
            className="text-sm text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="mr-1 inline-block h-3.5 w-3.5 align-[-2px]" />Stock
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        {filterLink(`/stock/${collectionId}`, filter === "all", "Toutes")}
        {filterLink(
          `/stock/${collectionId}?filter=owned`,
          filter === "owned",
          "En stock uniquement",
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Aucune extension en stock"
          description="Aucune extension ne contient encore de cartes à vendre dans cette collection."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((s) => (
            <div
              key={s.id}
              className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-accent/50 hover:shadow-float"
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
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/stock/set/${s.id}`}
                    className="min-w-0 truncate font-semibold text-ink transition-colors hover:text-brand"
                  >
                    {s.name}
                  </Link>
                  {s.abbreviation && (
                    <span className="shrink-0 rounded-md border border-brand-accent/30 bg-brand-accent/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-accent">
                      {s.abbreviation}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted">
                  {formatNumber(s.inStockDistinct)} carte{s.inStockDistinct > 1 ? "s" : ""} ·{" "}
                  {formatNumber(s.inStockQuantity)} exemplaire{s.inStockQuantity > 1 ? "s" : ""} en stock
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}