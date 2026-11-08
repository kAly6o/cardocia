import { NextResponse } from "next/server";
import { searchCards } from "@/lib/queries/catalogue";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limit = Number(searchParams.get("limit") ?? "12");
  const cards = await searchCards(q, Math.min(limit, 50));
  return NextResponse.json({ cards });
}
