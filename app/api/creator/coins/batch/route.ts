import { NextRequest, NextResponse } from "next/server";
import { fetchCreatorCoinsBatch } from "@/lib/profile";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("identifiers");
  if (!raw) return NextResponse.json({ error: "identifiers is required (comma-separated)" }, { status: 400 });
  const identifiers = raw.split(",").map(s => s.trim()).filter(Boolean);
  if (!identifiers.length) return NextResponse.json({ error: "no identifiers provided" }, { status: 400 });
  try {
    const data = await fetchCreatorCoinsBatch(identifiers);
    return NextResponse.json({ items: data }, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
