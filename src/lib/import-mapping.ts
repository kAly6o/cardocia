// Correspondance des colonnes CSV (aliases FR/EN) pour l'assistant d'import.

import { normalizeHeader } from "./csv";

export type ImportType = "achats" | "ventes" | "inventaire";

export interface ImportField {
  key: string;
  label: string;
  required?: boolean;
  aliases: string[];
}

const FIELDS: Record<ImportType, ImportField[]> = {
  achats: [
    { key: "purchase_date", label: "Date", aliases: ["Date", "Date d'achat", "Date achat", "Date de commande", "Purchase date", "Order date", "Issue date"] },
    { key: "seller_name", label: "Vendeur", aliases: ["Vendeur", "Seller", "Seller name", "Nom vendeur"] },
    { key: "reference", label: "Référence", aliases: ["Référence", "Reference", "Ref", "Numéro de commande", "N° de commande", "Order id", "Order", "Article id", "ArticleID", "Id article"] },
    { key: "description", label: "Description", aliases: ["Description", "Commentaire", "Comment", "Comments"] },
    { key: "currency", label: "Devise", aliases: ["Devise", "Currency", "Monnaie"] },
    { key: "total", label: "Total", aliases: ["Total", "Prix total", "Montant", "Total price"] },
    { key: "shipping_cost", label: "Frais de port", aliases: ["Port", "Frais de port", "Frais port", "Shipping", "Shipping cost"] },
    { key: "extra_fees", label: "Frais / commission", aliases: ["Frais", "Commission", "Fees"] },
    { key: "name", label: "Carte / article", aliases: ["Nom", "Name", "Carte", "Card", "Article", "Product", "Produit", "Nom de la carte", "Article name", "Card name"] },
    { key: "extension", label: "Extension", aliases: ["Extension", "Set", "Série", "Serie", "Expansion", "Code extension", "Extension code"] },
    { key: "card_number", label: "Numéro", aliases: ["Numéro", "Numero", "Numéro carte", "Card number", "Collector number", "N°", "Num"] },
    { key: "language", label: "Langue", aliases: ["Langue", "Language", "Lang"] },
    { key: "condition", label: "État", aliases: ["État", "Etat", "Condition", "État carte"] },
    { key: "finish", label: "Finition", aliases: ["Finition", "Finish", "Variante", "Foiling"] },
    { key: "quantity", label: "Quantité", aliases: ["Quantité", "Quantite", "Quantity", "Qty", "Qté"] },
    { key: "unit_price", label: "Prix unitaire", aliases: ["Prix", "Prix unitaire", "Unit price", "Price", "Prix d'achat", "Prix achat"] },
  ],
  ventes: [
    { key: "sale_date", label: "Date", aliases: ["Date", "Date de vente", "Date vente", "Sale date"] },
    { key: "platform", label: "Plateforme", aliases: ["Plateforme", "Platform", "Marketplace"] },
    { key: "reference", label: "Référence", aliases: ["Référence", "Reference", "Ref", "Numéro de commande", "N° de commande", "Order id", "Order", "Article id", "ArticleID", "Id article"] },
    { key: "buyer", label: "Acheteur", aliases: ["Acheteur", "Buyer", "Client"] },
    { key: "currency", label: "Devise", aliases: ["Devise", "Currency"] },
    { key: "fees", label: "Frais / commission", aliases: ["Frais", "Commission", "Fees", "Frais plateforme"] },
    { key: "shipping_fees", label: "Frais de port", aliases: ["Frais de port", "Frais port", "Port", "Shipping"] },
    { key: "amount_received", label: "Montant encaissé", aliases: ["Encaissé", "Encaissement", "Montant reçu", "Amount received", "Total", "Prix total", "Montant"] },
    { key: "profit", label: "Bénéfice", aliases: ["Bénéfice", "Benefice", "Profit", "Gain"] },
    { key: "name", label: "Carte / article", aliases: ["Nom", "Name", "Carte", "Card", "Article", "Produit", "Card name", "Article name"] },
    { key: "quantity", label: "Quantité", aliases: ["Quantité", "Quantite", "Quantity", "Qty", "Qté"] },
    { key: "unit_price", label: "Prix unitaire", aliases: ["Prix", "Prix unitaire", "Unit price", "Price", "Prix de vente"] },
  ],
  inventaire: [
    { key: "name", label: "Carte", required: true, aliases: ["Nom", "Name", "Carte", "Card", "Card name", "Nom de la carte"] },
    { key: "extension", label: "Extension", aliases: ["Extension", "Set", "Série", "Expansion", "Code extension"] },
    { key: "card_number", label: "Numéro", aliases: ["Numéro", "Numero", "Numéro carte", "Card number", "Collector number", "N°", "Num"] },
    { key: "language", label: "Langue", aliases: ["Langue", "Language", "Lang"] },
    { key: "condition", label: "État", aliases: ["État", "Condition"] },
    { key: "finish", label: "Finition", aliases: ["Finition", "Finish", "Foiling"] },
    { key: "quantity", label: "Quantité", aliases: ["Quantité", "Quantity", "Qty", "Qté", "Amount"] },
    { key: "acquisition_cost", label: "Coût d'acquisition", aliases: ["Coût", "Cout", "Prix d'achat", "Prix achat", "Cost"] },
    { key: "estimated_value", label: "Valeur estimée", aliases: ["Valeur", "Valeur estimée", "Estimated value"] },
    { key: "location", label: "Emplacement", aliases: ["Emplacement", "Position", "Location", "Classeur", "Dossier"] },
    { key: "acquisition_date", label: "Date d'acquisition", aliases: ["Date", "Date d'acquisition", "Date acquisition", "Acquisition date"] },
  ],
};

export function getImportFields(type: ImportType): ImportField[] {
  return FIELDS[type];
}

/** Propose une correspondance automatique colonne → champ pour un type donné. */
export function suggestMapping(headers: string[], type: ImportType): Record<string, string> {
  const mapping: Record<string, string> = {};
  const used = new Set<number>();
  const normHeaders = headers.map((h) => normalizeHeader(h));

  for (const field of FIELDS[type]) {
    const aliases = field.aliases.map(normalizeHeader);
    for (let i = 0; i < normHeaders.length; i++) {
      if (used.has(i)) continue;
      if (aliases.includes(normHeaders[i])) {
        mapping[field.key] = headers[i];
        used.add(i);
        break;
      }
    }
  }

  return mapping;
}