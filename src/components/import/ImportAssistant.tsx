"use client";

import { useActionState, useState } from "react";
import { SectionTitle } from "@/components/ui/StatCard";
import { SubmitButton } from "@/components/ui/Button";
import { Field, Select, Input, FormMessage, type ActionState } from "@/components/ui/Form";
import { parseCsv } from "@/lib/csv";
import { getImportFields, suggestMapping, type ImportType } from "@/lib/import-mapping";
import { importCsv, type ImportSummary } from "@/lib/actions/import";
import { CURRENCIES } from "@/lib/constants";

const TYPES: { value: ImportType; label: string }[] = [
  { value: "achats", label: "Achats" },
  { value: "ventes", label: "Ventes" },
  { value: "inventaire", label: "Inventaire (collection)" },
];

export function ImportAssistant() {
  const [type, setType] = useState<ImportType>("achats");
  const [platform, setPlatform] = useState("Cardmarket");
  const [currency, setCurrency] = useState("EUR");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const [state, action] = useActionState<
    (ActionState & { summary?: ImportSummary }) | null,
    FormData
  >(importCsv, null);

  const fields = getImportFields(type);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCsv(String(reader.result ?? ""));
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMapping(suggestMapping(parsed.headers, type));
    };
    reader.readAsText(file);
  }

  function handleTypeChange(next: ImportType) {
    setType(next);
    if (headers.length > 0) setMapping(suggestMapping(headers, next));
  }

  const preview = rows.slice(0, 5);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Importez un historique CSV d&apos;achats, de ventes ou d&apos;inventaire. La
        correspondance des colonnes est proposée automatiquement et reste modifiable.
      </p>

      <form action={action} className="space-y-6">
        <input type="hidden" name="mapping" value={JSON.stringify(mapping)} />

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Type d'import">
            <Select
              name="type"
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as ImportType)}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Plateforme">
            <Input
              name="platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="Cardmarket, eBay…"
            />
          </Field>
          <Field label="Devise">
            <Select
              name="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Fichier CSV"
          hint="Séparateur détecté automatiquement ( ; , tabulation | )."
        >
          <Input type="file" name="file" accept=".csv,text/csv" onChange={handleFile} />
        </Field>
{headers.length > 0 && (
          <>
            <div>
              <SectionTitle>Correspondance des colonnes</SectionTitle>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {fields.map((f) => (
                  <Field key={f.key} label={f.label + (f.required ? " *" : "")}>
                    <Select
                      value={mapping[f.key] ?? ""}
                      onChange={(e) =>
                        setMapping((m) => ({ ...m, [f.key]: e.target.value }))
                      }
                    >
                      <option value="">— ignorer —</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ))}
              </div>
            </div>

            <div>
              <SectionTitle>
                Aperçu ({rows.length} ligne{rows.length > 1 ? "s" : ""})
              </SectionTitle>
              <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-surface">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface-2/60">
                      {headers.map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {preview.map((r, i) => (
                      <tr key={i}>
                        {r.map((c, j) => (
                          <td key={j} className="px-3 py-2 text-ink">
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <FormMessage state={state} />

        {state?.summary && (
          <div className="rounded-xl border border-line bg-surface p-4 text-sm">
            <p className="font-medium text-ink">Résultat de l&apos;import</p>
            <p className="mt-1 text-muted">
              {state.summary.totalRows} ligne(s) lue(s) ·{" "}
              <span className="font-medium text-emerald-400">{state.summary.imported} importée(s)</span>{" · "}
              <span className="font-medium text-amber-400">{state.summary.duplicates} doublon(s)</span>{" · "}
              <span className="font-medium text-red-400">{state.summary.errors} erreur(s)</span>
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <SubmitButton disabled={headers.length === 0} pendingText="Import en cours…">
            Importer
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}