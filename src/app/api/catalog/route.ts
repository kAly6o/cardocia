import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Navigation du catalogue (lecture, données partagées) :
 *   /api/catalog?type=collections
 *   /api/catalog?type=sets&collection={id}
 *   /api/catalog?type=cards&set={id}
 */
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") ?? "collections";
  const supabase = await createClient();

  if (type === "collections") {
    const { data } = await supabase
      .from("catalog_collections")
      .select("id, name")
      .order("sort_order")
      .order("name");
    return NextResponse.json({ collections: data ?? [] });
  }

  if (type === "sets") {
    const collection = req.nextUrl.searchParams.get("collection");
    let q = supabase
      .from("catalog_sets")
      .select("id, name, card_count")
      .order("release_date", { ascending: true, nullsFirst: false })
      .order("name");
    if (collection) q = q.eq("collection_id", collection);
    const { data } = await q.limit(500);
    return NextResponse.json({ sets: data ?? [] });
  }

  if (type === "cards") {
    const set = req.nextUrl.searchParams.get("set");
    if (!set) return NextResponse.json({ cards: [] });
    const { data } = await supabase
      .from("catalog_cards")
      .select("id, name, number, image, rarity, pokemon_type")
      .eq("set_id", set)
      .limit(1000);
    const cards = (data ?? []).sort((a, b) =>
      String(a.number).localeCompare(String(b.number), "fr", { numeric: true }),
    );
    return NextResponse.json({ cards });
  }

  return NextResponse.json({ collections: [], sets: [], cards: [] });
}
