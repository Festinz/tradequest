import { NextResponse } from "next/server";
import { getCurrentPrice } from "@/lib/kis/getCurrent";
import { assertKisPersonalMode } from "@/lib/kis/guard";

/**
 * 종목 현재가 조회 API.
 * - KIS 개인 모드일 때만 동작 (약관)
 * - 일반 모드: TradingView 위젯이 가격 표시 → 이 라우트는 호출 X
 */
export async function GET(req: Request) {
  const guard = await assertKisPersonalMode();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error, message: "message" in guard ? guard.message : undefined }, { status: guard.status });
  }

  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker");
  if (!ticker) return NextResponse.json({ error: "ticker_required" }, { status: 400 });

  try {
    const data = await getCurrentPrice(ticker);
    return NextResponse.json(data, {
      headers: { "cache-control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "kis_unavailable" }, { status: 502 });
  }
}
