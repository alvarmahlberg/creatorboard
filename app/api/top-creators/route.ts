import { NextResponse } from "next/server";
import { fetchTopCreators } from "@/lib/top-creators";

export async function GET() {
  try {
    // Lisää cache-busting header
    const data = await fetchTopCreators();
    return NextResponse.json({ items: data }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Cache-Bust': Date.now().toString()
      }
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
