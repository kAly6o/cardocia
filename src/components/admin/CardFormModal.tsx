"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select, Textarea, FormMessage, type ActionState } from "@/components/ui/Form";
import { SubmitButton, Button } from "@/components/ui/Button";
import { saveCard } from "@/lib/actions/admin";
import { RARITIES, POKEMON_TYPE_LABELS } from "@/lib/constants";

export interface CardFormItem {
  id: string;
  set_id: string;
  name: string;
  number: string;
  external_id: string | null;
  image: string | null;
  rarity: string | null;
  pokemon_type: string | null;
  illustrator: string | null;
  description: string | null;
}

export interface CardSetOption {
  id: string;
  label: string;
}

export function CardFormModal({
  item,
  sets,
  trigger,
}: {
  item?: CardFormItem;
  sets: CardSetOption[];
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState | null, FormData>(saveCard, null);
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
            {editing ? "Éditer" : "Ajouter une carte"}
          </Button>
        )}
      </span>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Modifier la carte" : "Ajouter une carte"}
      >
        <form action={action} className="space-y-4">
          {item && <input type="hidden" name="id" value={item.id} />}
          <Field label="Extension">
            <Select name="set_id" required defaultValue={item?.set_id ?? ""}>
              <option value="" disabled>
                Choisir…
              </option>
              {sets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nom">
              <Input name="name" required defaultValue={item?.name ?? ""} />
            </Field>
            <Field label="Numéro">
              <Input name="number" required defaultValue={item?.number ?? ""} placeholder="12/102" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rareté">
              <Select name="rarity" defaultValue={item?.rarity ?? ""}>
                <option value="">—</option>
                {RARITIES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Type">
              <Select name="pokemon_type" defaultValue={item?.pokemon_type ?? ""}>
                <option value="">—</option>
                {POKEMON_TYPE_LABELS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Illustrateur">
              <Input name="illustrator" defaultValue={item?.illustrator ?? ""} />
            </Field>
            <Field label="Identifiant externe (TCGdex)">
              <Input name="external_id" defaultValue={item?.external_id ?? ""} />
            </Field>
          </div>
          <Field label="Image (URL)">
            <Input name="image" defaultValue={item?.image ?? ""} placeholder="https://…" />
          </Field>
          <Field label="Description">
            <Textarea name="description" rows={2} defaultValue={item?.description ?? ""} />
          </Field>
          <FormMessage state={state} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <SubmitButton>{editing ? "Enregistrer" : "Ajouter"}</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
