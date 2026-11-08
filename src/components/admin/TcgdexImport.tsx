"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { FormMessage, type ActionState } from "@/components/ui/Form";
import { SubmitButton, Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { importTcgdexSeries } from "@/lib/actions/tcgdex";
import { cn } from "@/lib/utils";

export interface TcgdexSeriesOption {
  id: string;
  name: string;
  imported: boolean;
}

export function TcgdexImport({ series }: { series: TcgdexSeriesOption[] }) {
  const [state, action] = useActionState<ActionState | null, FormData>(
    importTcgdexSeries,
    null,
  );
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state, router]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <form action={action} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          Cochez les séries à importer (collection + extensions + cartes).
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setChecked(new Set(series.map((s) => s.id)))}
          >
            Tout cocher
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setChecked(new Set())}
          >
            Tout décocher
          </Button>
        </div>
      </div>

      {series.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          Aucune série disponible (vérifiez votre connexion à l'API TCGdex).
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {series.map((s) => (
            <label
              key={s.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                checked.has(s.id)
                  ? "border-brand bg-surface-2"
                  : "border-line hover:bg-surface-2/60",
              )}
            >
              <input
                type="checkbox"
                name="series"
                value={s.id}
                checked={checked.has(s.id)}
                onChange={() => toggle(s.id)}
                className="h-4 w-4 shrink-0 accent-brand"
              />
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-2 text-xs font-bold text-fire">
                {s.name[0]?.toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">
                  {s.name}
                </span>
                {s.imported && (
                  <Badge className="mt-1 border-emerald-600/40 bg-emerald-900/30 text-emerald-300">
                    déjà importée
                  </Badge>
                )}
              </span>
            </label>
          ))}
        </div>
      )}

      <FormMessage state={state} />

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton
          disabled={checked.size === 0}
          pendingText="Import en cours (peut prendre plusieurs minutes)…"
        >
          Importer la sélection
        </SubmitButton>
        <p className="text-xs text-faint">
          L'import complet (rarité + type) peut être long sur une grosse série.
        </p>
      </div>
    </form>
  );
}
