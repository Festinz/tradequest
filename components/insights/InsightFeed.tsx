import type { Insight, Severity } from "@/lib/skills/types";
import InsightCard from "./InsightCard";

const ORDER: Severity[] = ["warning", "bearish", "bullish", "info"];

const GROUP_LABEL: Record<Severity, { label: string; color: string }> = {
  warning: { label: "⚠ Warning · 즉시 점검", color: "text-amber-700" },
  bearish: { label: "📉 Bearish · 약세 신호", color: "text-bearish" },
  bullish: { label: "📈 Bullish · 강세 신호", color: "text-bullish" },
  info: { label: "ℹ Info · 참고", color: "text-brand" },
};

export default function InsightFeed({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return (
      <div className="rounded-card border-2 border-dashed border-border bg-surface-1 p-8 text-center text-caption text-text-2">
        현재 발동 중인 인사이트가 없어. 더 매매하거나 시간이 지나면 신호가 잡혀.
      </div>
    );
  }

  // severity 별로 그룹
  const grouped = new Map<Severity, Insight[]>();
  for (const ins of insights) {
    const arr = grouped.get(ins.severity) ?? [];
    arr.push(ins);
    grouped.set(ins.severity, arr);
  }

  return (
    <div className="space-y-6">
      {ORDER.map((sev) => {
        const items = grouped.get(sev);
        if (!items || items.length === 0) return null;
        const meta = GROUP_LABEL[sev];
        return (
          <section key={sev}>
            <h2 className={`mb-3 text-h3 ${meta.color}`}>
              {meta.label} ({items.length})
            </h2>
            <div className="space-y-2">
              {items.map((ins) => (
                <InsightCard
                  key={`${ins.rule_id}-${ins.ticker}`}
                  insight={ins}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
