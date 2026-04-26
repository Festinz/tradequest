import { getKisAccessToken } from "./auth";

/**
 * 종목 현재가 조회.
 * - tr_id: FHKST01010100 (실전), 모의투자 동일
 * - 1초당 호출 제한 있음 → 호출 측에서 캐싱 또는 batch 권장
 */
export type KisCurrent = {
  ticker: string;
  price: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  changePct: number;
  volume: number;
  fetchedAt: string;
};

export async function getCurrentPrice(ticker: string): Promise<KisCurrent> {
  const token = await getKisAccessToken();
  const baseUrl = process.env.KIS_BASE_URL!;

  const url = new URL(`${baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price`);
  url.searchParams.set("FID_COND_MRKT_DIV_CODE", "J");
  url.searchParams.set("FID_INPUT_ISCD", ticker);

  const res = await fetch(url.toString(), {
    headers: {
      authorization: `Bearer ${token}`,
      appkey: process.env.KIS_APP_KEY!,
      appsecret: process.env.KIS_APP_SECRET!,
      tr_id: "FHKST01010100",
    },
    // KIS API 는 캐시 비활성화
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`KIS getCurrent failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as {
    output: {
      stck_prpr: string; // 현재가
      stck_oprc: string; // 시가
      stck_hgpr: string; // 고가
      stck_lwpr: string; // 저가
      stck_sdpr: string; // 전일종가
      prdy_ctrt: string; // 전일대비율
      acml_vol: string; // 누적거래량
    };
  };

  const o = json.output;
  return {
    ticker,
    price: Number(o.stck_prpr),
    open: Number(o.stck_oprc),
    high: Number(o.stck_hgpr),
    low: Number(o.stck_lwpr),
    prevClose: Number(o.stck_sdpr),
    changePct: Number(o.prdy_ctrt),
    volume: Number(o.acml_vol),
    fetchedAt: new Date().toISOString(),
  };
}
