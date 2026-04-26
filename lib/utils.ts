import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind 클래스를 안전하게 합쳐주는 헬퍼 (shadcn 스타일). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 원화 포맷 (₩1,084,210). */
export function formatKRW(value: number) {
  return `₩${value.toLocaleString("ko-KR")}`;
}

/** 손익률 포맷 (+8.4% / -3.2%). 한국 시장 컨벤션: + 빨강, - 파랑. */
export function formatPct(value: number, digits = 1) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

/** 손익률 색상 클래스 (Tailwind). 빨강=상승, 파랑=하락. */
export function pnlColor(value: number) {
  if (value > 0) return "text-bullish";
  if (value < 0) return "text-bearish";
  return "text-text-2";
}

/** 한국식 날짜 포맷 (2026.04.25). */
export function formatDateKR(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
