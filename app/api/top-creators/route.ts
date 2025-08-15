import { NextResponse } from "next/server";
import { fetchTopCreators } from "@/lib/top-creators";

export async function GET() {
  try {
    console.log(`[${new Date().toISOString()}] API endpoint called - fetching top creators`);
    const data = await fetchTopCreators();
    console.log(`[${new Date().toISOString()}] API endpoint - data fetched, returning ${data.length} items`);
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
