import { Activity, Banknote, Target, Trophy } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { MiniChart } from "@/components/MiniChart";
import { PositionTable } from "@/components/PositionTable";
import { ProgressBar } from "@/components/ProgressBar";
import { TradeTable } from "@/components/TradeTable";
import { WarningBanner } from "@/components/WarningBanner";
import { getMockCandles } from "@/lib/mockMarket";
import { readAccount } from "@/lib/store";
import { computeMetrics } from "@/lib/tradingEngine";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default async function Home() {
  const account = await readAccount();
  const metrics = await computeMetrics(account);
  const chartValues = getMockCandles(account.settings.watchlist[0] ?? "AAPL").slice(-18).map((candle) => candle.close);

  return (
    <>
      <WarningBanner />
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
          label="Win rate"
          value={`${metrics.winRate}%`}
          detail={`${metrics.closedPositions.length} closed paper positions`}
          icon={<Target size={20} />}
        />
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded border border-line bg-panel/90 p-5 shadow-glow">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Command Center</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Daily Goal Tracker</h2>
            </div>
            <span className="rounded border border-amber/40 bg-amber/10 px-3 py-1 text-xs font-semibold text-amber">
              Unrealistic target warning
            </span>
          </div>
          <ProgressBar
            value={metrics.dailyGoalProgress}
            targetLabel={`${account.settings.dailyTargetPercent}% daily goal is a target only, not an expectation or guarantee.`}
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded border border-line bg-ink/60 p-3">
              <p className="text-xs text-slate-400">Daily P/L</p>
              <p className={metrics.dailyPnl >= 0 ? "mt-1 font-semibold text-mint" : "mt-1 font-semibold text-danger"}>
                {money.format(metrics.dailyPnl)}
              </p>
            </div>
            <div className="rounded border border-line bg-ink/60 p-3">
              <p className="text-xs text-slate-400">Max daily loss</p>
              <p className="mt-1 font-semibold text-white">{account.settings.maxDailyLossPercent}%</p>
            </div>
            <div className="rounded border border-line bg-ink/60 p-3">
              <p className="text-xs text-slate-400">Trading status</p>
              <p className={metrics.tradingHalted ? "mt-1 font-semibold text-danger" : "mt-1 font-semibold text-mint"}>
                {metrics.tradingHalted ? "Halted" : "Simulation active"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded border border-line bg-panel/90 p-5 shadow-glow">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Mock price stream</p>
          <h2 className="mt-1 text-xl font-semibold text-white">{account.settings.watchlist[0] ?? "AAPL"} trend</h2>
          <div className="mt-4">
            <MiniChart values={chartValues} />
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-xl font-semibold text-white">Open Positions</h2>
        <div className="overflow-x-auto">
          <PositionTable positions={metrics.openPositions} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold text-white">Recent Simulated Trades</h2>
        <div className="overflow-x-auto">
          <TradeTable trades={metrics.recentTrades} />
        </div>
      </section>
    </>
  );
}
