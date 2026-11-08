"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Field, Input, Select, Textarea, FormMessage, type ActionState } from "@/components/ui/Form";
import { SubmitButton, Button } from "@/components/ui/Button";
import { CardPicker } from "@/components/cards/CardPicker";
import { saveSale } from "@/lib/actions/sales";
import { CURRENCIES, PRODUCT_TYPES, DEFAULT_PLATFORMS, SALE_STATUSES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export interface StockOption {
  id: string;
  label: string;
  cost: number | null;
  card_id: string | null;
}

interface Line {
  product_type: string;
  name: string;
  card_id: string;
  stock_item_id: string;
  quantity: string;
  unit_price: string;
  unit_cost: string;
}

function emptyLine(): Line {
  return {
    product_type: "Carte",
    name: "",
    card_id: "",
    stock_item_id: "",
    quantity: "1",
    unit_price: "",
    unit_cost: "",
  };
}

export function SaleForm({
  stockOptions,
  platforms = [],
}: {
  stockOptions: StockOption[];
  platforms?: string[];
}) {
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [state, action] = useActionState<ActionState | null, FormData>(saveSale, null);

  const gross = lines.reduce(
    (s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_price.replace(",", ".")) || 0),
    0,
  );

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function linkStock(i: number, stockId: string) {
    const item = stockOptions.find((s) => s.id === stockId);
    if (!item) {
      updateLine(i, { stock_item_id: "", unit_cost: "", name: "", card_id: "" });
      return;
    }
    updateLine(i, {
      stock_item_id: item.id,
      unit_cost: item.cost != null ? String(item.cost) : "",
      name: item.label,
      card_id: item.card_id ?? "",
    });
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="lines_json" value={JSON.stringify(lines)} />

      <div className="panel-pad grid gap-3 sm:grid-cols-4">
        <Field label="Date">
          <Input name="sale_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        </Field>
        <Field label="Plateforme">
          <Input name="platform" list="platforms" defaultValue="Vente directe" />
          <datalist id="platforms">
            {[...DEFAULT_PLATFORMS, ...platforms].map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </Field>
        <Field label="Devise">
          <Select name="currency" defaultValue="EUR">
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Statut">
          <Select name="status" defaultValue="Validée">
            {SALE_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field label="Référence">
          <Input name="reference" placeholder="N° de transaction" />
        </Field>
        <Field label="Acheteur (optionnel)">
          <Input name="buyer" placeholder="Nom de l'acheteur" />
        </Field>
        <Field label="Frais de vente">
          <Input name="fees" type="number" step="0.01" inputMode="decimal" defaultValue="0" />
        </Field>
        <Field label="Expédition">
          <Input name="shipping_fees" type="number" step="0.01" inputMode="decimal" defaultValue="0" />
        </Field>
        <div className="sm:col-span-4">
          <Field label="Notes">
            <Textarea name="notes" rows={2} />
          </Field>
        </div>
      </div>
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Produits vendus</h2>
        {lines.map((l, i) => (
          <div key={i} className="panel-pad grid gap-3 sm:grid-cols-12">
            <div className="sm:col-span-3">
              <Field label="Type">
                <Select value={l.product_type} onChange={(e) => updateLine(i, { product_type: e.target.value })}>
                  {PRODUCT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="sm:col-span-4">
              <Field label="Associer un article du stock">
                <Select value={l.stock_item_id} onChange={(e) => linkStock(i, e.target.value)}>
                  <option value="">— Aucun (vente libre) —</option>
                  {stockOptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </Select>
              </Field>
            </div>
            {l.product_type === "Carte" && !l.stock_item_id ? (
              <div className="sm:col-span-5">
                <Field label="Carte">
                  <CardPicker
                    name={`card_id_${i}`}
                    defaultLabel={l.name}
                    onSelect={(c) => updateLine(i, { card_id: c.id, name: c.name })}
                    onClear={() => updateLine(i, { card_id: "", name: "" })}
                  />
                </Field>
              </div>
            ) : (
              <div className="sm:col-span-5">
                <Field label="Produit">
                  <Input value={l.name} onChange={(e) => updateLine(i, { name: e.target.value })} placeholder="Nom du produit" />
                </Field>
              </div>
            )}
            <div className="sm:col-span-3">
              <Field label="Quantité">
                <Input type="number" min={1} value={l.quantity} onChange={(e) => updateLine(i, { quantity: e.target.value })} />
              </Field>
            </div>
            <div className="sm:col-span-3">
              <Field label="Prix unitaire">
                <Input type="number" step="0.01" inputMode="decimal" value={l.unit_price} onChange={(e) => updateLine(i, { unit_price: e.target.value })} placeholder="0.00" />
              </Field>
            </div>
            <div className="sm:col-span-3">
              <Field label="Coût de revient">
                <Input type="number" step="0.01" inputMode="decimal" value={l.unit_cost} onChange={(e) => updateLine(i, { unit_cost: e.target.value })} placeholder="0.00" />
              </Field>
            </div>
            <div className="flex items-end sm:col-span-3">
              <Button type="button" variant="ghost" onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))} disabled={lines.length === 1}>
                Retirer
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setLines((prev) => [...prev, emptyLine()])}>
          + Ajouter une ligne
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          Montant brut : <span className="font-semibold text-ink">{formatCurrency(gross)}</span>
        </p>
        <FormMessage state={state} />
      </div>

      <div className="flex justify-end gap-2">
        <SubmitButton size="lg">Enregistrer la vente</SubmitButton>
      </div>
    </form>
  );
}
