import { NextRequest, NextResponse } from "next/server";
import { fetchCreatorCoin } from "@/lib/profile";

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("identifier");
  if (!id) return NextResponse.json({ error: "identifier is required" }, { status: 400 });
  try {
    const data = await fetchCreatorCoin(id);
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
