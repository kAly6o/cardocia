"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Td } from "@/components/ui/Table";
import { IconButton } from "@/components/ui/Button";
import { SetFormModal, type SetCollectionOption } from "@/components/admin/SetFormModal";
import { CollectionFormModal } from "@/components/admin/CollectionFormModal";
import { CardFormModal, type CardSetOption } from "@/components/admin/CardFormModal";
import type { CatalogHealthCheck, CatalogHealthSeverity } from "@/lib/queries/admin";
import { formatNumber } from "@/lib/utils";

const SEVERITY: Record<
  CatalogHealthSeverity,
  { label: string; className: string; accent: string }
> = {
  error: {
    label: "Erreur",
    className: "border-red-600/40 bg-red-900/30 text-red-300",
    accent: "#ef4444",
  },
  warning: {
    label: "Avertissement",
    className: "border-amber-600/40 bg-amber-900/30 text-amber-300",
    accent: "#f59e0b",
  },
  info: {
    label: "Information",
    className: "border-sky-600/40 bg-sky-900/30 text-sky-300",
    accent: "#0ea5e9",
  },
};

export function HealthCheckList({
  checks,
  collectionOptions,
  setOptions,
}: {
  checks: CatalogHealthCheck[];
  collectionOptions: SetCollectionOption[];
  setOptions: CardSetOption[];
}) {
  return (
    <div className="space-y-4">
      {checks.map((check) => {
        const s = SEVERITY[check.severity];
        const fixable = check.items.some((it) => it.kind !== "none");

        return (
          <section key={check.key} className="panel-pad">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-medium text-ink">{check.label}</h2>
                <Badge className={s.className}>{s.label}</Badge>
                <span className="text-sm font-semibold tabular-nums" style={{ color: s.accent }}>
                  {formatNumber(check.count)}
                </span>
              </div>
              <Link
                href={check.href}
                className="text-sm font-medium text-brand transition-colors hover:text-brand-strong"
              >
                Voir dans le catalogue →
              </Link>
            </div>

            <p className="mt-1 text-sm text-muted">{check.description}</p>
{check.count === 0 ? (
              <p className="mt-3 text-sm text-emerald-300">Aucun élément concerné.</p>
            ) : (
              <>
                <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-surface">
                  <table className="w-full min-w-[480px] border-collapse">
                    <thead>
                      <tr className="border-b border-line bg-surface-2/60">
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                          Nom
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                          Détail
                        </th>
                        {fixable && (
                          <th className="w-12 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                            Action
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {check.items.map((it) => (
                        <tr key={it.id} className="hover:bg-surface-2/40">
                          <Td className="font-medium text-ink">{it.name}</Td>
                          <Td className="text-muted">{it.detail ?? "—"}</Td>
                          {fixable && (
                            <Td>
                              {it.kind === "set" && (
                                <SetFormModal
                                  item={it.edit}
                                  collections={collectionOptions}
                                  trigger={
                                    <IconButton title="Corriger">
                                      <Pencil className="h-4 w-4" />
                                    </IconButton>
                                  }
                                />
                              )}
                              {it.kind === "collection" && (
                                <CollectionFormModal
                                  item={it.edit}
                                  trigger={
                                    <IconButton title="Corriger">
                                      <Pencil className="h-4 w-4" />
                                    </IconButton>
                                  }
                                />
                              )}
                              {it.kind === "card" && (
                                <CardFormModal
                                  item={it.edit}
                                  sets={setOptions}
                                  trigger={
                                    <IconButton title="Corriger">
                                      <Pencil className="h-4 w-4" />
                                    </IconButton>
                                  }
                                />
                              )}
                            </Td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {check.count > check.items.length && (
                  <p className="mt-2 text-xs text-muted">
                    {formatNumber(check.count - check.items.length)} autre(s) élément(s) non
                    affiché(s).
                  </p>
                )}
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}