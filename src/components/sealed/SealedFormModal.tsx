"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select, Textarea, FormMessage, type ActionState } from "@/components/ui/Form";
import { SubmitButton, Button } from "@/components/ui/Button";
import { saveSealedProduct } from "@/lib/actions/sealed";
import { SEALED_PRODUCT_TYPES, LANGUAGES, CONDITIONS } from "@/lib/constants";

export function SealedFormModal({
  sets,
  trigger,
}: {
  sets: { id: string; name: string }[];
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState | null, FormData>(saveSealedProduct, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  return (
    <>
      <span onClick={() => setOpen(true)} className="inline-flex">
        {trigger ?? <Button>Ajouter un produit scellé</Button>}
      </span>
      <Modal open={open} onClose={() => setOpen(false)} title="Ajouter un produit scellé">
        <form action={action} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nom">
              <Input name="name" required placeholder="Display Écarlate et Violet" />
            </Field>
            <Field label="Type">
              <Select name="product_type" defaultValue="Booster">
                {SEALED_PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Field label="Extension (optionnel)">
              <Select name="set_id" defaultValue="">
                <option value="">Aucune</option>
                {sets.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Langue">
              <Select name="language" defaultValue="FR">
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Quantité">
              <Input name="quantity" type="number" min={0} defaultValue={1} />
            </Field>
            <Field label="État">
              <Select name="condition" defaultValue="Neuf">
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Prix d'achat">
              <Input name="purchase_price" type="number" step="0.01" inputMode="decimal" placeholder="0.00" />
            </Field>
            <Field label="Valeur estimée">
              <Input name="estimated_value" type="number" step="0.01" inputMode="decimal" placeholder="0.00" />
            </Field>
            <Field label="Date d'achat">
              <Input name="purchase_date" type="date" />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea name="notes" rows={2} />
          </Field>
          <FormMessage state={state} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <SubmitButton>Ajouter</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
