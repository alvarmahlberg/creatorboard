import { NextRequest, NextResponse } from "next/server";
import { fetchRecentActivity } from "@/lib/profile";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  
  if (!address) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }
  
  try {
    const data = await fetchRecentActivity(address);
    return NextResponse.json({ items: data }, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
