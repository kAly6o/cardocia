"use client";

import { useCallback, useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select, Textarea, FormMessage, type ActionState } from "@/components/ui/Form";
import { SubmitButton, Button } from "@/components/ui/Button";
import { CardGridPicker, type PickedCard } from "@/components/cards/CardGridPicker";
import { CardImage } from "@/components/cards/CardImage";
import { saveStockItem } from "@/lib/actions/stock";
import { LANGUAGES, CONDITIONS, FINISHES, STOCK_STATUSES } from "@/lib/constants";

export interface StockFormItem {
  id: string;
  card_id: string;
  language: string;
  condition: string;
  finish: string;
  acquisition_cost: number | null;
  desired_price: number | null;
  estimated_value: number | null;
  quantity: number;
  status: string;
  notes: string | null;
  cardLabel?: string;
}

export function StockFormModal({
  item,
  trigger,
  initialCard,
  open: openProp,
  onOpenChange,
}: {
  item?: StockFormItem;
  trigger?: React.ReactNode;
  initialCard?: PickedCard;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [openInternal, setOpenInternal] = useState(false);
  const [picked, setPicked] = useState<PickedCard | null>(initialCard ?? null);

  // Synchronise picked avec initialCard quand celle-ci change (ex: nouvelle carte sélectionnée depuis le catalogue)
  useEffect(() => {
    setPicked(initialCard ?? null);
  }, [initialCard]);
  const [state, action] = useActionState<ActionState | null, FormData>(
    saveStockItem,
    null,
  );
  const router = useRouter();
  const pathname = usePathname();

  const open = openProp ?? openInternal;
  const setOpen = useCallback(
    (next: boolean) => {
      if (onOpenChange) onOpenChange(next);
      else setOpenInternal(next);
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
      setPicked(null);
      // On ne recharge que si on est sur la page stock, pour voir sa nouvelle carte.
      // Sur les autres pages, pas de rechargement : l'ajout est déjà pris en compte.
      if (pathname.startsWith("/stock")) {
        router.refresh();
      }
    }
  }, [state, router, pathname, setOpen]);

  const editing = Boolean(item);
  const showForm = editing || picked !== null;

  const close = () => {
    setOpen(false);
    setPicked(initialCard ?? null);
  };

  return (
    <>
      <span onClick={() => setOpen(true)} className="inline-flex">
        {trigger ?? (
          <Button variant={editing ? "ghost" : "primary"} size={editing ? "sm" : "md"}>
            {editing ? "Éditer" : "Ajouter au stock"}
          </Button>
        )}
      </span>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={
          editing
            ? "Modifier l'article"
            : picked
              ? `Ajouter : ${picked.name}`
              : "Choisir une carte"
        }
        className={showForm ? "max-w-lg" : "max-w-4xl"}
      >
        {!showForm ? (
          <CardGridPicker onSelect={(c) => setPicked(c)} />
        ) : (
          <form action={action} className="space-y-4">
            {item && <input type="hidden" name="id" value={item.id} />}
            <input
              type="hidden"
              name="card_id"
              value={picked?.id ?? item?.card_id ?? ""}
            />

            <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-2 p-2">
              <div className="h-16 w-11 shrink-0 overflow-hidden rounded bg-surface-3">
                {picked && (
                  <CardImage src={picked.image} alt={picked.name} className="h-full w-full" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {picked?.name ?? item?.cardLabel ?? "Carte"}
                </p>
                <p className="text-xs text-muted">
                  {picked ? `n°${picked.number}` : "Article existant"}
                </p>
              </div>
              {!editing && (
                <button
                  type="button"
                  onClick={() => setPicked(null)}
                  className="text-xs text-muted transition-colors hover:text-ink"
                >
                  Changer
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
            <Field label="Langue">
              <Select name="language" defaultValue={item?.language ?? "FR"}>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="État">
              <Select name="condition" defaultValue={item?.condition ?? "Near Mint"}>
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Finition">
              <Select name="finish" defaultValue={item?.finish ?? "Normale"}>
                {FINISHES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Quantité">
              <Input name="quantity" type="number" min={1} defaultValue={item?.quantity ?? 1} />
            </Field>
            <Field label="Coût d'acquisition">
              <Input name="acquisition_cost" type="number" step="0.01" inputMode="decimal" placeholder="0.00" defaultValue={item?.acquisition_cost ?? ""} />
            </Field>
            <Field label="Prix souhaité">
              <Input name="desired_price" type="number" step="0.01" inputMode="decimal" placeholder="0.00" defaultValue={item?.desired_price ?? ""} />
            </Field>
            <Field label="Valeur estimée">
              <Input name="estimated_value" type="number" step="0.01" inputMode="decimal" placeholder="0.00" defaultValue={item?.estimated_value ?? ""} />
            </Field>
            <Field label="Statut">
              <Select name="status" defaultValue={item?.status ?? "Disponible"}>
                {STOCK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Notes">
            <Textarea name="notes" rows={2} defaultValue={item?.notes ?? ""} />
          </Field>

          <FormMessage state={state} />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={close}>
              Annuler
            </Button>
            <SubmitButton>{editing ? "Enregistrer" : "Ajouter"}</SubmitButton>
          </div>
        </form>
        )}
      </Modal>
    </>
  );
}
