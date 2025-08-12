import { NextResponse } from "next/server";
import { fetchTopGainers } from "@/lib/top-creators";

export async function GET() {
  try {
    const data = await fetchTopGainers();
    return NextResponse.json({ items: data }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
