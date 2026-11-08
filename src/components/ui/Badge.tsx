import { cn } from "@/lib/utils";
import {
  rarityColor,
  pokemonTypeColor,
  languageLabel,
} from "@/lib/constants";

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        className ?? "border-line bg-surface-2 text-muted",
      )}
    >
      {children}
    </span>
  );
}

export function RarityBadge({
  rarity,
  className,
}: {
  rarity: string | null | undefined;
  className?: string;
}) {
  if (!rarity) return <span className="text-faint">—</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        rarityColor(rarity),
        className,
      )}
    >
      {rarity}
    </span>
  );
}

export function TypeBadge({
  type,
  className,
}: {
  type: string | null | undefined;
  className?: string;
}) {
  if (!type) return <span className="text-faint">—</span>;
  const color = pokemonTypeColor(type);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold",
        className,
      )}
      style={{
        color: "#0b0b0d",
        backgroundColor: color,
        borderColor: color,
      }}
    >
      {type}
    </span>
  );
}

export function LanguageBadge({ code }: { code: string | null | undefined }) {
  if (!code) return <span className="text-faint">—</span>;
  return (
    <Badge className="border-line bg-surface-3 text-ink">{languageLabel(code)}</Badge>
  );
}

const STATUS_COLORS: Record<string, string> = {
  Disponible: "border-emerald-600/40 bg-emerald-900/30 text-emerald-300",
  Réservé: "border-amber-600/40 bg-amber-900/30 text-amber-300",
  Vendu: "border-sky-600/40 bg-sky-900/30 text-sky-300",
  "Dans lot": "border-violet-600/40 bg-violet-900/30 text-violet-300",
  "Dans booster": "border-fuchsia-600/40 bg-fuchsia-900/30 text-fuchsia-300",
  Brouillon: "border-line bg-surface-2 text-muted",
  Annulé: "border-red-600/40 bg-red-900/30 text-red-300",
  "En attente": "border-amber-600/40 bg-amber-900/30 text-amber-300",
  Reçu: "border-emerald-600/40 bg-emerald-900/30 text-emerald-300",
  Validée: "border-emerald-600/40 bg-emerald-900/30 text-emerald-300",
  importée: "border-emerald-600/40 bg-emerald-900/30 text-emerald-300",
  ignorée: "border-line bg-surface-2 text-muted",
  doublon: "border-amber-600/40 bg-amber-900/30 text-amber-300",
  erreur: "border-red-600/40 bg-red-900/30 text-red-300",
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-faint">—</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        STATUS_COLORS[status] ?? "border-line bg-surface-2 text-muted",
      )}
    >
      {status}
    </span>
  );
}
