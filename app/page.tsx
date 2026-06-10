import { Activity, Banknote, RadioTower, Target, Trophy } from "lucide-react";
import { CommandCenter } from "@/components/CommandCenter";
import { MetricCard } from "@/components/MetricCard";
import { PositionTable } from "@/components/PositionTable";
import { TradeTable } from "@/components/TradeTable";
import { WarningBanner } from "@/components/WarningBanner";
import { fetchMarketCandles } from "@/lib/mockMarket";
import { readAccount } from "@/lib/store";
import { computeMetrics } from "@/lib/tradingEngine";
import type { AccountMetrics } from "@/lib/types";

export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default async function Home() {
  const account = await readAccount();
  let liveError = "";
  let chartValues: number[] = [];
  let metrics: AccountMetrics;

  try {
    metrics = await computeMetrics(account);
  } catch (error) {
    liveError = getErrorMessage(error);
    metrics = fallbackMetrics(account.settings.startingBalance, account.cash);
  }

  try {
    const candles = await fetchMarketCandles(account.settings.watchlist[0] ?? "AAPL");
    chartValues = candles.slice(-48).map((candle) => candle.close);
  } catch (error) {
    liveError = liveError || getErrorMessage(error);
  }

  return (
    <>
      <WarningBanner />
      <CommandCenter
        metrics={metrics}
        settings={account.settings}
        chartValues={chartValues}
        liveStatus={liveError ? "Needs attention" : "Streaming"}
        liveError={liveError}
      />

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Starting paper balance" value={money.format(metrics.startingBalance)} detail="Fake money only" icon={<Banknote size={20} />} />
        <MetricCard label="Current fake equity" value={money.format(metrics.equity)} detail={`${money.format(metrics.cash)} available cash`} icon={<Activity size={20} />} />
        <MetricCard
          label="Total P/L"
          value={money.format(metrics.totalPnl)}
          detail={`${metrics.totalPnlPercent}% since start`}
          tone={metrics.totalPnl >= 0 ? "positive" : "negative"}
          icon={<Trophy size={20} />}
        />
        <MetricCard
          label="Live feed"
          value={liveError ? "Blocked" : "Online"}
          detail={liveError ? "Polygon data needs attention" : "Fresh bars accepted"}
          tone={liveError ? "warning" : "positive"}
          icon={liveError ? <Target size={20} /> : <RadioTower size={20} />}
        />
      </section>

      <section className="mb-6 grid gap-4 xl:grid-cols-[1fr_0.72fr]">
        <div>
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white">Open Positions</h2>
            <span className="text-sm text-slate-500">Simulated holdings only</span>
          </div>
          <div className="overflow-x-auto">
            <PositionTable positions={metrics.openPositions} />
          </div>
        </div>

        <div className="rounded border border-line bg-panel/90 p-5 shadow-glow">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Risk Console</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Daily Guardrails</h2>
          <div className="mt-5 grid gap-3">
            <RiskRow label="Daily P/L" value={money.format(metrics.dailyPnl)} tone={metrics.dailyPnl >= 0 ? "text-mint" : "text-danger"} />
            <RiskRow label="Daily goal progress" value={`${metrics.dailyGoalProgress}%`} tone="text-cyan" />
            <RiskRow label="Trading status" value={metrics.tradingHalted ? "Halted" : "Simulation active"} tone={metrics.tradingHalted ? "text-danger" : "text-mint"} />
            <RiskRow label="Win rate" value={`${metrics.winRate}%`} tone="text-white" />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">Recent Simulated Trades</h2>
          <span className="text-sm text-slate-500">No brokerage orders</span>
        </div>
        <div className="overflow-x-auto">
          <TradeTable trades={metrics.recentTrades} />
        </div>
      </section>
    </>
  );
}

function RiskRow({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between rounded border border-line bg-ink/60 px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`font-semibold ${tone}`}>{value}</span>
    </div>
  );
}

function fallbackMetrics(startingBalance: number, cash: number): AccountMetrics {
  return {
    startingBalance,
    cash,
    equity: cash,
    totalPnl: 0,
    totalPnlPercent: 0,
    dailyPnl: 0,
    dailyPnlPercent: 0,
    dailyGoalProgress: 0,
    winRate: 0,
    openPositions: [],
    closedPositions: [],
    recentTrades: [],
    tradingHalted: false,
    warnings: []
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Live market data is currently unavailable.";
}
