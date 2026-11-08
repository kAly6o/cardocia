import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Th({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("px-3 py-2.5 text-sm text-ink", className)}>{children}</td>
  );
}

export function Table({
  headers,
  children,
  empty,
}: {
  headers: ReactNode[];
  children: ReactNode;
  empty?: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr className="border-b border-line bg-surface-2/60">
            {headers.map((h, i) => (
              <Th key={i}>{h}</Th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav className="flex items-center gap-1">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="h-8 rounded-lg border border-line px-3 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-40"
      >
        Précédent
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={cn(
            "h-8 w-8 rounded-lg border text-sm transition-colors",
            p === page
              ? "border-brand bg-brand text-white"
              : "border-line text-muted hover:bg-surface-2 hover:text-ink",
          )}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        className="h-8 rounded-lg border border-line px-3 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-40"
      >
        Suivant
      </button>
    </nav>
  );
}

/** Pagination pilotée par l'URL (paramètre `page`). */
export function PagePagination({
  page,
  pageCount,
  basePath,
}: {
  page: number;
  pageCount: number;
  basePath: string;
}) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  const link = (p: number) => `${basePath}?page=${p}`;

  return (
    <nav className="flex items-center gap-1">
      {page > 1 ? (
        <Link
          href={link(page - 1)}
          className="h-8 rounded-lg border border-line px-3 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          Précédent
        </Link>
      ) : null}
      {pages.map((p) =>
        p === page ? (
          <span
            key={p}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand bg-brand text-sm text-white"
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={link(p)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            {p}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link
          href={link(page + 1)}
          className="h-8 rounded-lg border border-line px-3 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          Suivant
        </Link>
      ) : null}
    </nav>
  );
}
