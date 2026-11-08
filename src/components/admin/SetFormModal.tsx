"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select, FormMessage, type ActionState } from "@/components/ui/Form";
import { SubmitButton, Button } from "@/components/ui/Button";
import { saveSet } from "@/lib/actions/admin";

export interface SetFormItem {
  id: string;
  collection_id: string;
  name: string;
  original_name: string | null;
  external_id: string | null;
  symbol: string | null;
  logo: string | null;
  release_date: string | null;
  card_count: number | null;
}

export interface SetCollectionOption {
  id: string;
  name: string;
}

export function SetFormModal({
  item,
  collections,
  trigger,
}: {
  item?: SetFormItem;
  collections: SetCollectionOption[];
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState | null, FormData>(saveSet, null);
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
            {editing ? "Éditer" : "Ajouter une extension"}
          </Button>
        )}
      </span>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Modifier l'extension" : "Ajouter une extension"}
      >
        <form action={action} className="space-y-4">
          {item && <input type="hidden" name="id" value={item.id} />}
          <Field label="Collection">
            <Select name="collection_id" required defaultValue={item?.collection_id ?? ""}>
              <option value="" disabled>
                Choisir…
              </option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nom">
              <Input name="name" required defaultValue={item?.name ?? ""} />
            </Field>
            <Field label="Nom original">
              <Input name="original_name" defaultValue={item?.original_name ?? ""} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Symbole">
              <Input name="symbol" defaultValue={item?.symbol ?? ""} />
            </Field>
            <Field label="Date de sortie">
              <Input name="release_date" type="date" defaultValue={item?.release_date ?? ""} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Identifiant externe (TCGdex)">
              <Input name="external_id" defaultValue={item?.external_id ?? ""} />
            </Field>
            <Field label="Nombre de cartes">
              <Input name="card_count" type="number" defaultValue={item?.card_count ?? ""} />
            </Field>
          </div>
          <Field label="Logo (URL)">
            <Input name="logo" defaultValue={item?.logo ?? ""} placeholder="https://…" />
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
