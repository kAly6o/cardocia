"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select, Textarea, FormMessage, type ActionState } from "@/components/ui/Form";
import { SubmitButton, Button } from "@/components/ui/Button";
import { saveRecipe } from "@/lib/actions/boosters";
import { CompositionRuleInput } from "@/components/composition/CompositionRuleInput";
import type { CompositionRule } from "@/lib/compose";
import { LANGUAGES } from "@/lib/constants";

export interface RecipeFormItem {
  id: string;
  name: string;
  language: string;
  desired_price: number | null;
  description: string | null;
  quotas: CompositionRule | null;
}

export function RecipeFormModal({
  item,
  trigger,
}: {
  item?: RecipeFormItem;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState | null, FormData>(saveRecipe, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  const editing = Boolean(item);

  return (
    <>
      <span onClick={() => setOpen(true)} className="inline-flex">
        {trigger ?? <Button>{editing ? "Éditer" : "Nouvelle recette"}</Button>}
      </span>
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Modifier la recette" : "Nouvelle recette de booster"}>
        <form action={action} className="space-y-4">
          {item && <input type="hidden" name="id" value={item.id} />}
          <Field label="Nom">
            <Input name="name" required placeholder="Booster standard" defaultValue={item?.name ?? ""} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Langue">
              <Select name="language" defaultValue={item?.language ?? "FR"}>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Prix souhaité">
              <Input name="desired_price" type="number" step="0.01" inputMode="decimal" placeholder="0.00" defaultValue={item?.desired_price ?? ""} />
            </Field>
          </div>
          <Field
            label="Composition automatique"
            hint="Définissez des règles : l'app piochera les cartes dans votre stock disponible."
          >
            <CompositionRuleInput name="rule" defaultValue={item?.quotas ?? null} />
          </Field>
          <Field label="Description">
            <Textarea name="description" rows={2} defaultValue={item?.description ?? ""} />
          </Field>
          <FormMessage state={state} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <SubmitButton>{editing ? "Enregistrer" : "Créer"}</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

