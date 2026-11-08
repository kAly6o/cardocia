"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Field, Input, Select, Textarea, FormMessage, type ActionState } from "@/components/ui/Form";
import { SubmitButton, Button } from "@/components/ui/Button";
import { CardPicker } from "@/components/cards/CardPicker";
import { savePurchase } from "@/lib/actions/purchases";
import { CURRENCIES, PRODUCT_TYPES, LANGUAGES, CONDITIONS, FINISHES, PURCHASE_STATUSES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

interface Line {
  product_type: string;
  name: string;
  card_id: string;
  language: string;
  condition: string;
  finish: string;
  quantity: string;
  unit_price: string;
}

function emptyLine(): Line {
  return {
    product_type: "Carte",
    name: "",
    card_id: "",
    language: "FR",
    condition: "Near Mint",
    finish: "Normale",
    quantity: "1",
    unit_price: "",
  };
}

export function PurchaseForm() {
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [state, action] = useActionState<ActionState | null, FormData>(
    savePurchase,
    null,
  );

  const subtotal = lines.reduce(
    (s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_price.replace(",", ".")) || 0),
    0,
  );

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="lines_json" value={JSON.stringify(lines)} />

      <div className="panel-pad grid gap-3 sm:grid-cols-3">
        <Field label="Date">
          <Input name="purchase_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        </Field>
        <Field label="Devise">
          <Select name="currency" defaultValue="EUR">
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Statut">
          <Select name="status" defaultValue="En attente">
            {PURCHASE_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field label="Vendeur (texte libre)">
          <Input name="seller_name" placeholder="Nom du vendeur / boutique" />
        </Field>
        <Field label="Référence">
          <Input name="reference" placeholder="N° de commande" />
        </Field>
        <Field label="Frais de livraison">
          <Input name="shipping_cost" type="number" step="0.01" inputMode="decimal" defaultValue="0" />
        </Field>
        <Field label="Frais supplémentaires">
          <Input name="extra_fees" type="number" step="0.01" inputMode="decimal" defaultValue="0" />
        </Field>
        <Field label="Description">
          <Input name="description" placeholder="Description libre" />
        </Field>
        <div className="sm:col-span-3">
          <Field label="Notes">
            <Textarea name="notes" rows={2} />
          </Field>
        </div>
      </div>
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Produits achetés
        </h2>
        {lines.map((l, i) => (
          <div key={i} className="panel-pad grid gap-3 sm:grid-cols-12">
            <div className="sm:col-span-3">
              <Field label="Type">
                <Select
                  value={l.product_type}
                  onChange={(e) => updateLine(i, { product_type: e.target.value })}
                >
                  {PRODUCT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </Field>
            </div>
            {l.product_type === "Carte" ? (
              <>
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
                <div className="grid grid-cols-3 gap-2 sm:col-span-4">
                  <Field label="Langue">
                    <Select value={l.language} onChange={(e) => updateLine(i, { language: e.target.value })}>
                      {LANGUAGES.map((x) => (
                        <option key={x.code} value={x.code}>{x.code}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="État">
                    <Select value={l.condition} onChange={(e) => updateLine(i, { condition: e.target.value })}>
                      {CONDITIONS.map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Finition">
                    <Select value={l.finish} onChange={(e) => updateLine(i, { finish: e.target.value })}>
                      {FINISHES.map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </>
            ) : (
              <div className="sm:col-span-9">
                <Field label="Produit">
                  <Input
                    value={l.name}
                    onChange={(e) => updateLine(i, { name: e.target.value })}
                    placeholder={`Nom du produit (${l.product_type})`}
                  />
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
            <div className="flex items-end sm:col-span-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={lines.length === 1}
              >
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
          Sous-total produits :{" "}
          <span className="font-semibold text-ink">{formatCurrency(subtotal)}</span>
        </p>
        <FormMessage state={state} />
      </div>

      <div className="flex justify-end gap-2">
        <SubmitButton size="lg">Enregistrer l'achat</SubmitButton>
      </div>
    </form>
  );
}
