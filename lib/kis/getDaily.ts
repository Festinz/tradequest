import { getKisAccessToken } from "./auth";

/**
 * 종목 일봉 차트 조회 (최근 N영업일).
 * - tr_id: FHKST03010100
 * - TradingView Lightweight Charts 입력 포맷({time, open, high, low, close})으로 반환
 */
export type Candle = {
  time: string; // 'YYYY-MM-DD'
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export async function getDailyCandles(
  ticker: string,
  opts: { from: string; to: string; period?: "D" | "W" | "M" } = {
    from: "20250101",
    to: "20260101",
  }
): Promise<Candle[]> {
  const token = await getKisAccessToken();
  const baseUrl = process.env.KIS_BASE_URL!;

  const url = new URL(
    `${baseUrl}/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice`
  );
  url.searchParams.set("FID_COND_MRKT_DIV_CODE", "J");
  url.searchParams.set("FID_INPUT_ISCD", ticker);
  url.searchParams.set("FID_INPUT_DATE_1", opts.from);
  url.searchParams.set("FID_INPUT_DATE_2", opts.to);
  url.searchParams.set("FID_PERIOD_DIV_CODE", opts.period ?? "D");
  url.searchParams.set("FID_ORG_ADJ_PRC", "0");

  const res = await fetch(url.toString(), {
    headers: {
      authorization: `Bearer ${token}`,
      appkey: process.env.KIS_APP_KEY!,
      appsecret: process.env.KIS_APP_SECRET!,
      tr_id: "FHKST03010100",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`KIS getDaily failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as {
    output2: Array<{
      stck_bsop_date: string; // 영업일자 'YYYYMMDD'
      stck_oprc: string;
      stck_hgpr: string;
      stck_lwpr: string;
      stck_clpr: string;
      acml_vol: string;
    }>;
  };

  // 응답은 최신→과거 → TradingView 는 과거→최신 필요
  return (json.output2 ?? [])
    .map((row) => ({
      time: `${row.stck_bsop_date.slice(0, 4)}-${row.stck_bsop_date.slice(4, 6)}-${row.stck_bsop_date.slice(6, 8)}`,
      open: Number(row.stck_oprc),
      high: Number(row.stck_hgpr),
      low: Number(row.stck_lwpr),
      close: Number(row.stck_clpr),
      volume: Number(row.acml_vol),
    }))
    .reverse();
}
