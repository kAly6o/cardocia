"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Textarea, FormMessage, type ActionState } from "@/components/ui/Form";
import { SubmitButton, Button } from "@/components/ui/Button";
import { saveCollection } from "@/lib/actions/admin";

export interface CollectionFormItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  sort_order: number;
}

export function CollectionFormModal({
  item,
  trigger,
}: {
  item?: CollectionFormItem;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState | null, FormData>(saveCollection, null);
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
            {editing ? "Éditer" : "Ajouter une collection"}
          </Button>
        )}
      </span>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Modifier la collection" : "Ajouter une collection"}
      >
        <form action={action} className="space-y-4">
          {item && <input type="hidden" name="id" value={item.id} />}
          <Field label="Nom">
            <Input name="name" required defaultValue={item?.name ?? ""} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Identifiant (slug)" hint="Généré automatiquement si vide">
              <Input name="slug" defaultValue={item?.slug ?? ""} placeholder="ma-collection" />
            </Field>
            <Field label="Ordre d'affichage">
              <Input name="sort_order" type="number" defaultValue={item?.sort_order ?? 0} />
            </Field>
          </div>
          <Field label="Description">
            <Textarea name="description" rows={2} defaultValue={item?.description ?? ""} />
          </Field>
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
