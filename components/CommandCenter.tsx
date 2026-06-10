"use client";

import { useMemo, useState } from "react";
import { Activity, Gauge, RefreshCcw, ShieldCheck, Signal, Sparkles, Target, Zap } from "lucide-react";
import { MiniChart } from "@/components/MiniChart";
import { RunResearchButton } from "@/components/RunResearchButton";
import type { AccountMetrics, Settings } from "@/lib/types";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const tabs = ["Overview", "Risk", "Agent"] as const;

type Tab = (typeof tabs)[number];

export function CommandCenter({
  metrics,
  settings,
  chartValues,
  liveStatus,
  liveError
}: {
  metrics: AccountMetrics;
  settings: Settings;
  chartValues: number[];
  liveStatus: string;
  liveError?: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [focusedSymbol, setFocusedSymbol] = useState(settings.watchlist[0] ?? "AAPL");
  const targetDollars = useMemo(() => (settings.startingBalance * settings.dailyTargetPercent) / 100, [settings]);

  return (
    <section className="mb-6 overflow-hidden rounded border border-cyan/20 bg-panel/90 shadow-glow">
      <div className="relative border-b border-line bg-ink/70 p-5 lg:p-6">
        <div className="absolute inset-x-0 top-0 h-px bg-cyan/50" />
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded border border-mint/30 bg-mint/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-mint">
                <Signal size={14} /> Live Polygon Feed
              </span>
              <span className="rounded border border-amber/40 bg-amber/10 px-3 py-1 text-xs font-semibold text-amber">
                Paper Trading Only
              </span>
            </div>
            <h2 className="text-3xl font-semibold text-white lg:text-4xl">AI Trading Command Center</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300 lg:text-base">
              A live-data research cockpit for fake-money decision testing. The agent can study the market, score setups,
              and simulate risk-managed paper trades without touching a brokerage account.
            </p>
          </div>
          <div className="grid min-w-[260px] gap-3 rounded border border-line bg-panel2/80 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Feed status</span>
              <span className={liveError ? "text-sm font-semibold text-danger" : "text-sm font-semibold text-mint"}>{liveStatus}</span>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded border border-line bg-ink px-3 py-2 text-sm text-slate-200 transition hover:border-cyan hover:text-white"
            >
              <RefreshCcw size={16} /> Refresh Live Data
            </button>
            <RunResearchButton compact />
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-line bg-ink/40 p-4 lg:border-b-0 lg:border-r">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-500">Watchlist</p>
          <div className="grid gap-2">
            {settings.watchlist.map((symbol) => (
              <button
                key={symbol}
                type="button"
                onClick={() => setFocusedSymbol(symbol)}
                className={`flex items-center justify-between rounded border px-3 py-2 text-sm transition ${
                  focusedSymbol === symbol
                    ? "border-cyan bg-cyan/10 text-white"
                    : "border-line bg-panel/70 text-slate-300 hover:border-cyan/60"
                }`}
              >
                <span className="font-semibold">{symbol}</span>
                <span className="text-xs text-slate-500">{symbol === focusedSymbol ? "Selected" : "Scan"}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="p-4 lg:p-6">
          <div className="mb-5 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab ? "bg-cyan text-ink" : "border border-line bg-ink text-slate-300 hover:border-cyan hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {liveError ? (
            <div className="mb-5 rounded border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
              {liveError}
            </div>
          ) : null}

          {activeTab === "Overview" ? (
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded border border-line bg-ink/60 p-4">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Focused market</p>
                    <h3 className="mt-1 text-2xl font-semibold text-white">{focusedSymbol}</h3>
                  </div>
                  <span className="rounded border border-mint/30 bg-mint/10 px-3 py-1 text-sm text-mint">Live only</span>
                </div>
                <MiniChart values={chartValues} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <PanelStat icon={<Activity size={18} />} label="Fake equity" value={money.format(metrics.equity)} detail="Simulation balance" />
                <PanelStat icon={<Target size={18} />} label="Daily target" value={money.format(targetDollars)} detail={`${settings.dailyTargetPercent}% stretch goal`} />
                <PanelStat icon={<Sparkles size={18} />} label="Daily P/L" value={money.format(metrics.dailyPnl)} detail={`${metrics.dailyPnlPercent}% today`} />
                <PanelStat icon={<Zap size={18} />} label="Win rate" value={`${metrics.winRate}%`} detail="Closed paper trades" />
              </div>
            </div>
          ) : null}

          {activeTab === "Risk" ? (
            <div className="grid gap-4 md:grid-cols-3">
              <PanelStat icon={<ShieldCheck size={18} />} label="Risk per trade" value={`${settings.riskPerTradePercent}%`} detail="Default paper risk cap" />
              <PanelStat icon={<Gauge size={18} />} label="Max daily loss" value={`${settings.maxDailyLossPercent}%`} detail={metrics.tradingHalted ? "Trading halted" : "Guardrail active"} />
              <PanelStat icon={<Target size={18} />} label="Never all-in" value="25-35% cap" detail="Position sizing constraint" />
              <div className="rounded border border-line bg-ink/60 p-4 md:col-span-3">
                <p className="text-sm leading-6 text-slate-300">
                  The simulator keeps trades fake, sizes positions from risk settings, and blocks trading when daily loss rules are hit.
                  The 20% target is shown as a stretch marker only, not a forecast.
                </p>
              </div>
            </div>
          ) : null}

          {activeTab === "Agent" ? (
            <div className="rounded border border-line bg-ink/60 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Research workflow</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">Run a live market study</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    The agent reads Polygon candles, scores trend, RSI, MACD, volume, placeholder sentiment, and risk/reward,
                    then creates simulated trade ideas only.
                  </p>
                </div>
                <RunResearchButton />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function PanelStat({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="rounded border border-line bg-ink/60 p-4 transition hover:border-cyan/50 hover:bg-panel2/70">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded border border-cyan/30 bg-cyan/10 text-cyan">{icon}</div>
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{detail}</p>
    </div>
  );
}
