"use client";

import { IconButton } from "@/components/ui/Button";
import { ConfirmForm } from "@/components/ui/ConfirmForm";
import { StockFormModal } from "./StockFormModal";
import { deleteStockItem, setStockStatus } from "@/lib/actions/stock";
import { Banknote, Pencil, Pin, RotateCcw, Trash2 } from "lucide-react";

export interface StockRowActionsItem {
  id: string;
  card_id: string;
  language: string;
  condition: string;
  finish: string;
  acquisition_cost: number | null;
  desired_price: number | null;
  quantity: number;
  status: string;
  notes: string | null;
  cardLabel?: string;
}

/** Boutons d'action d'une ligne de stock (réservation / vente / édition / suppression). */
export function StockRowActions({ item }: { item: StockRowActionsItem }) {
  return (
    <div className="flex items-center gap-1">
      {item.status === "Disponible" && (
        <form action={setStockStatus}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="status" value="Réservé" />
          <IconButton type="submit" title="Réserver">
            <Pin className="h-4 w-4" />
          </IconButton>
        </form>
      )}
      {item.status === "Réservé" && (
        <form action={setStockStatus}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="status" value="Disponible" />
          <IconButton type="submit" title="Remettre disponible">
            <RotateCcw className="h-4 w-4" />
          </IconButton>
        </form>
      )}
      {(item.status === "Disponible" || item.status === "Réservé") && (
        <form action={setStockStatus}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="status" value="Vendu" />
          <IconButton
            type="submit"
            title="Marquer comme vendu"
            className="hover:bg-emerald-900/30 hover:text-emerald-300"
          >
            <Banknote className="h-4 w-4" />
          </IconButton>
        </form>
      )}
      <StockFormModal
        item={{ ...item, estimated_value: null }}
        trigger={<IconButton title="Modifier"><Pencil className="h-4 w-4" /></IconButton>}
      />
      <ConfirmForm
        action={deleteStockItem}
        message="Supprimer cet article du stock ? L'opération sera tracée dans l'historique."
      >
        <input type="hidden" name="id" value={item.id} />
        <IconButton
          type="submit"
          title="Supprimer"
          className="hover:bg-red-900/30 hover:text-red-300"
        >
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </ConfirmForm>
    </div>
  );
}