/**
 * VIZ-007 섹터 트리맵 — CSS grid 기반 (D3 X).
 * 12-column grid 에 평가금액 비례로 셀을 배치.
 * 각 셀의 색은 일간 등락률 (한국 컨벤션 빨강↑/파랑↓).
 */

import type { Holding } from "@/lib/portfolio/holdings";
import { formatKRW, formatPct } from "@/lib/utils";

type Props = {
  holdings: Holding[];
};

/** 등락률 → 트리맵 셀 배경 클래스 */
function tintFor(deltaPct: number): string {
  if (deltaPct >= 3) return "bg-red-200 text-red-900";
  if (deltaPct >= 1) return "bg-red-100 text-red-800";
  if (deltaPct > 0) return "bg-red-50 text-red-700";
  if (deltaPct === 0) return "bg-surface-2 text-text-2";
  if (deltaPct > -1) return "bg-blue-50 text-blue-700";
  if (deltaPct > -3) return "bg-blue-100 text-blue-800";
  return "bg-blue-200 text-blue-900";
}

/** 12-col grid 에서 셀이 차지할 col span. 비중을 0.5%~100% 범위로 받아 1~12 사이 정수로 매핑. */
function colSpan(pct: number): number {
  if (pct >= 30) return 12;
  if (pct >= 18) return 8;
  if (pct >= 10) return 6;
  if (pct >= 6) return 5;
  if (pct >= 3) return 4;
  if (pct >= 1.5) return 3;
  return 2;
}

export default function SectorTreemap({ holdings }: Props) {
  if (holdings.length === 0) {
    return (
      <div className="rounded-card border-2 border-dashed border-border bg-surface-1 p-8 text-center text-caption text-text-2">
        보유 종목이 없으면 트리맵을 그릴 수 없어.
      </div>
    );
  }

  const total = holdings.reduce((s, h) => s + h.market_value, 0);
  if (total <= 0) return null;

  // 섹터별 그룹 + 섹터 합계
  const sectors = new Map<string, Holding[]>();
  for (const h of holdings) {
    const arr = sectors.get(h.sector) ?? [];
    arr.push(h);
    sectors.set(h.sector, arr);
  }

  // 섹터 합계 큰 순 정렬
  const sectorOrder = Array.from(sectors.entries())
    .map(([sector, items]) => ({
      sector,
      items,
      total: items.reduce((s, x) => s + x.market_value, 0),
    }))
    .sort((a, b) => b.total - a.total);

  // 섹터 편중 (INS-009 인라인 표시용)
  const topSector = sectorOrder[0];
  const topPct = (topSector.total / total) * 100;
  const showSectorAlert = topPct > 50;

  return (
    <div>
      <div className="grid auto-rows-[78px] grid-cols-12 gap-1">
        {sectorOrder.map(({ sector, items }) => {
          // 섹터 안에서 종목별로 비중 큰 순 정렬, 합계 col span 결정
          const sortedItems = [...items].sort(
            (a, b) => b.market_value - a.market_value,
          );
          return sortedItems.map((h) => {
            const pct = (h.market_value / total) * 100;
            const span = colSpan(pct);
            return (
              <div
                key={h.ticker}
                className={`relative flex flex-col justify-between overflow-hidden rounded-md p-2.5 ${tintFor(h.daily_change_pct)}`}
                style={{ gridColumn: `span ${span} / span ${span}` }}
                title={`${h.name} · ${sector} · ${pct.toFixed(1)}%`}
              >
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-[13px] font-bold">{h.name}</div>
                  <div className="truncate text-[10px] opacity-80">
                    {sector} · {pct.toFixed(1)}%
                  </div>
                </div>
                <div className="flex items-end justify-between gap-1">
                  <span className="font-mono text-[10px]">
                    {formatPct(h.daily_change_pct)}
                  </span>
                  <span className="font-mono text-[11px] font-semibold">
                    {formatKRW(h.market_value)}
                  </span>
                </div>
              </div>
            );
          });
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-text-3">
        <Swatch className="bg-red-200" label="+1~3%" />
        <Swatch className="bg-red-100" label="+0~1%" />
        <Swatch className="bg-surface-2" label="±0%" />
        <Swatch className="bg-blue-100" label="−0~1%" />
        <Swatch className="bg-blue-200" label="−1~3%" />
      </div>

      {showSectorAlert && (
        <div className="mt-4 flex items-center gap-3 rounded-card border border-brand/20 bg-brand/5 px-4 py-3">
          <span className="inline-flex items-center rounded-chip bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
            INS-009
          </span>
          <p className="flex-1 text-caption text-text-2">
            <strong className="text-text-1">
              {topSector.sector} 섹터 {topPct.toFixed(1)}% 편중.
            </strong>{" "}
            섹터 사이클 리스크 점검 권장.
          </p>
        </div>
      )}
    </div>
  );
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3.5 rounded-sm ${className}`} />
      {label}
    </span>
  );
}
