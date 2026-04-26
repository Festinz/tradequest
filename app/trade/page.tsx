import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TradeClient from "./TradeClient";
import AppShell from "@/components/AppShell";

export default async function TradePage({
  searchParams,
}: {
  searchParams: Promise<{ symbol?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: character } = await supabase
    .from("characters")
    .select("cash_balance")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!character) redirect("/onboarding");

  const { data: stocks } = await supabase
    .from("stocks")
    .select("ticker, name, market")
    .order("name");

  const { data: positions } = await supabase
    .from("positions")
    .select("ticker, qty, avg_price, stocks(name)")
    .eq("user_id", user.id);

  const { symbol } = await searchParams;

  return (
    <AppShell active="/trade">
      <TradeClient
        cash={character.cash_balance}
        initialSymbol={symbol ?? "KRX:005930"}
        stocks={stocks ?? []}
        positions={
          (positions ?? []).map((p) => ({
            ticker: p.ticker,
            qty: p.qty,
            avg_price: p.avg_price,
            name:
              (p as unknown as { stocks: { name: string } | null }).stocks?.name ??
              p.ticker,
          }))
        }
      />
    </AppShell>
  );
}
