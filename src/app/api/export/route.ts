import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "collection";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let headers: string[] = [];
  let rows: (string | number | null | undefined)[][] = [];

  switch (type) {
    case "collection": {
      const { data } = await supabase
        .from("collection_items")
        .select("*, card:catalog_cards(name, number)")
        .eq("user_id", user.id);
      headers = ["Carte", "Numéro", "Langue", "État", "Finition", "Quantité", "Coût", "Valeur estimée", "Emplacement", "Date"];
      rows = (data ?? []).map((r) => [
        r.card?.name ?? "",
        r.card?.number ?? "",
        r.language,
        r.condition,
        r.finish,
        r.quantity,
        r.acquisition_cost,
        r.estimated_value,
        r.location ?? "",
        r.acquisition_date ?? "",
      ]);
      break;
    }
    case "stock": {
      const { data } = await supabase
        .from("stock_items")
        .select("*, card:catalog_cards(name, number)")
        .eq("user_id", user.id);
      headers = ["Carte", "Numéro", "Langue", "État", "Finition", "Quantité", "Coût", "Prix souhaité", "Valeur estimée", "Statut"];
      rows = (data ?? []).map((r) => [
        r.card?.name ?? "",
        r.card?.number ?? "",
        r.language,
        r.condition,
        r.finish,
        r.quantity,
        r.acquisition_cost,
        r.desired_price,
        r.estimated_value,
        r.status,
      ]);
      break;
    }
    case "achats": {
      const { data } = await supabase
        .from("purchases")
        .select("*")
        .eq("user_id", user.id);
      headers = ["Date", "Vendeur", "Référence", "Devise", "Total", "Statut"];
      rows = (data ?? []).map((r) => [
        r.purchase_date,
        r.seller_name ?? "",
        r.reference ?? "",
        r.currency,
        r.total,
        r.status,
      ]);
      break;
    }
    case "ventes": {
      const { data } = await supabase
        .from("sales")
        .select("*")
        .eq("user_id", user.id);
      headers = ["Date", "Plateforme", "Référence", "Devise", "Encaissé", "Bénéfice", "Statut"];
      rows = (data ?? []).map((r) => [
        r.sale_date,
        r.platform,
        r.reference ?? "",
        r.currency,
        r.amount_received,
        r.profit,
        r.status,
      ]);
      break;
    }
    case "historique": {
      const { data } = await supabase
        .from("stock_movements")
        .select("*, card:catalog_cards(name)")
        .eq("user_id", user.id);
      headers = ["Date", "Type", "Carte", "Quantité", "Notes"];
      rows = (data ?? []).map((r) => [
        r.created_at,
        r.type,
        r.card?.name ?? "",
        r.quantity,
        r.notes ?? "",
      ]);
      break;
    }
    default: {
      return NextResponse.json({ error: "Type inconnu" }, { status: 400 });
    }
  }

  const csv = toCsv(headers, rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cardocia-${type}.csv"`,
    },
  });
}
