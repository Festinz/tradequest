import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  ArrowRight,
} from "lucide-react";
import type { Insight, Severity } from "@/lib/skills/types";

const SEVERITY_STYLE: Record<
  Severity,
  { border: string; iconBg: string; pillClass: string }
> = {
  warning: {
    border: "border-l-amber-500",
    iconBg: "bg-amber-100 text-amber-700",
    pillClass: "bg-amber-100 text-amber-800",
  },
  bearish: {
    border: "border-l-bearish",
    iconBg: "bg-bearish/15 text-bearish",
    pillClass: "bg-bearish/15 text-bearish",
  },
  bullish: {
    border: "border-l-bullish",
    iconBg: "bg-bullish/15 text-bullish",
    pillClass: "bg-bullish/15 text-bullish",
  },
  info: {
    border: "border-l-brand",
    iconBg: "bg-brand/15 text-brand",
    pillClass: "bg-brand/10 text-brand",
  },
};

function IconFor({ severity }: { severity: Severity }) {
  const cls = "h-5 w-5";
  switch (severity) {
    case "warning":
      return <AlertTriangle className={cls} />;
    case "bearish":
      return <TrendingDown className={cls} />;
    case "bullish":
      return <TrendingUp className={cls} />;
    case "info":
      return <Info className={cls} />;
  }
}

export default function InsightCard({
  insight,
  compact = false,
}: {
  insight: Insight;
  compact?: boolean;
}) {
  const s = SEVERITY_STYLE[insight.severity];
  const isPortfolio = insight.ticker === "PORTFOLIO";
  const linkHref = isPortfolio
    ? "/portfolio"
    : `/trade?symbol=KRX:${insight.ticker}`;
  const linkLabel = isPortfolio ? "포트폴리오" : "차트";

  return (
    <article
      className={`flex items-start gap-4 rounded-card border border-border border-l-4 bg-surface-0 p-4 ${s.border}`}
    >
      <div
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-card ${s.iconBg}`}
      >
        <IconFor severity={insight.severity} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-chip px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${s.pillClass}`}
          >
            {insight.rule_id}
          </span>
        </div>
        <p className="text-body font-semibold text-text-1">{insight.message}</p>
        {!compact && insight.action && (
          <p className="mt-1 text-caption text-text-2">권장: {insight.action}</p>
        )}
      </div>
      <Link
        href={linkHref}
        className="inline-flex shrink-0 items-center gap-0.5 self-center text-caption text-brand"
      >
        {linkLabel} <ArrowRight className="h-3 w-3" />
      </Link>
    </article>
  );
}
