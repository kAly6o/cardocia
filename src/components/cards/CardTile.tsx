import Link from "next/link";
import type { CatalogCard } from "@/lib/types";
import { CardImage } from "./CardImage";
import { RarityBadge, TypeBadge } from "@/components/ui/Badge";

export function CardTile({
  card,
  href,
}: {
  card: CatalogCard;
  href?: string;
}) {
  const content = (
    <div className="group overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-line-strong">
      <div className="aspect-[63/88] overflow-hidden bg-surface-2">
        <CardImage
          src={card.image}
          alt={card.name}
          className="h-full w-full transition-transform duration-200 group-hover:scale-[1.03]"
        />
      </div>
      <div className="p-2.5">
        <p className="truncate text-sm font-medium text-ink" title={card.name}>
          {card.name}
        </p>
        <p className="truncate text-xs text-muted">
          {card.set?.name ?? "—"} · n°{card.number}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {card.rarity && <RarityBadge rarity={card.rarity} />}
          {card.pokemon_type && <TypeBadge type={card.pokemon_type} />}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
