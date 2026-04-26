import { NextResponse } from "next/server";
import { getDailyCandles } from "@/lib/kis/getDaily";
import { assertKisPersonalMode } from "@/lib/kis/guard";

export async function GET(req: Request) {
  const guard = await assertKisPersonalMode();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error, message: "message" in guard ? guard.message : undefined }, { status: guard.status });
  }

  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker");
  const from = searchParams.get("from") ?? "20250101";
  const to = searchParams.get("to") ?? "20260101";
  if (!ticker) return NextResponse.json({ error: "ticker_required" }, { status: 400 });
  try {
    const data = await getDailyCandles(ticker, { from, to });
    return NextResponse.json(data, {
      headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "kis_unavailable" }, { status: 502 });
  }
}
