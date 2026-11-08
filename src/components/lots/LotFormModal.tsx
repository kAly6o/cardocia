"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Textarea, FormMessage, type ActionState } from "@/components/ui/Form";
import { SubmitButton, Button } from "@/components/ui/Button";
import { saveLot } from "@/lib/actions/lots";
import { CompositionRuleInput } from "@/components/composition/CompositionRuleInput";

export interface LotFormItem {
  id: string;
  name: string;
  description: string | null;
  desired_price: number | null;
}

export function LotFormModal({
  item,
  trigger,
}: {
  item?: LotFormItem;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState | null, FormData>(saveLot, null);
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
        {trigger ?? (
          <Button variant={editing ? "ghost" : "primary"} size={editing ? "sm" : "md"}>
            {editing ? "Éditer" : "Créer un lot"}
          </Button>
        )}
      </span>
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Modifier le lot" : "Créer un lot"}>
        <form action={action} className="space-y-4">
          {item && <input type="hidden" name="id" value={item.id} />}
          <Field label="Nom">
            <Input name="name" required defaultValue={item?.name ?? ""} />
          </Field>
          <Field label="Prix souhaité">
            <Input name="desired_price" type="number" step="0.01" inputMode="decimal" placeholder="0.00" defaultValue={item?.desired_price ?? ""} />
          </Field>
          {!editing && (
            <Field
              label="Composition automatique"
              hint="Définissez des règles : l'app piochera les cartes dans votre stock disponible."
            >
              <CompositionRuleInput name="rule" />
            </Field>
          )}
          <Field label="Description">
            <Textarea name="description" rows={3} defaultValue={item?.description ?? ""} />
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

