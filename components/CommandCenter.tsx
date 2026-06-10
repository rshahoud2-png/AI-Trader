"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Gauge, Loader2, Pause, Play, RefreshCcw, ShieldCheck, Signal, Sparkles, Target, Zap } from "lucide-react";
import { MiniChart } from "@/components/MiniChart";
import { RunResearchButton } from "@/components/RunResearchButton";
import type { AccountMetrics, MarketCandle, Settings } from "@/lib/types";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const tabs = ["Overview", "Risk", "Agent"] as const;

type Tab = (typeof tabs)[number];
type PanelKey = "equity" | "target" | "daily" | "win" | "risk" | "loss" | "cap";

type MarketPayload = {
  symbol: string;
  latest?: MarketCandle;
  previous?: MarketCandle;
  candles: MarketCandle[];
  updatedAt: string;
  error?: string;
};

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
  const [selectedPanel, setSelectedPanel] = useState<PanelKey>("equity");
  const [autoScan, setAutoScan] = useState(false);
  const [scanIndex, setScanIndex] = useState(0);
  const [isLoadingMarket, setIsLoadingMarket] = useState(false);
  const [marketError, setMarketError] = useState(liveError ?? "");
  const [marketUpdatedAt, setMarketUpdatedAt] = useState("");
  const [marketCandles, setMarketCandles] = useState<number[]>(chartValues);
  const [pulse, setPulse] = useState(0);

  const targetDollars = useMemo(() => (settings.startingBalance * settings.dailyTargetPercent) / 100, [settings]);
  const latestPrice = marketCandles.at(-1) ?? chartValues.at(-1) ?? 0;
  const previousPrice = marketCandles.at(-2) ?? marketCandles.at(0) ?? latestPrice;
  const priceChange = latestPrice - previousPrice;
  const priceChangePercent = previousPrice ? (priceChange / previousPrice) * 100 : 0;
  const status = marketError ? "Needs attention" : isLoadingMarket ? "Refreshing" : liveStatus;

  const loadMarket = useCallback(async (symbol: string) => {
    setIsLoadingMarket(true);
    setMarketError("");

    try {
      const response = await fetch(`/api/market/${encodeURIComponent(symbol)}`, { cache: "no-store" });
      const payload = (await response.json()) as MarketPayload;

      if (!response.ok) {
        setMarketError(payload.error ?? "Polygon market data failed.");
        return;
      }

      setMarketCandles(payload.candles.map((candle) => candle.close).slice(-72));
      setMarketUpdatedAt(payload.updatedAt);
    } catch {
      setMarketError("Unable to reach the live market API.");
    } finally {
      setIsLoadingMarket(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setPulse((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    void loadMarket(focusedSymbol);
  }, [focusedSymbol, loadMarket]);

  useEffect(() => {
    if (!autoScan || settings.watchlist.length < 2) return;

    const timer = window.setInterval(() => {
      setScanIndex((current) => {
        const next = (current + 1) % settings.watchlist.length;
        setFocusedSymbol(settings.watchlist[next]);
        return next;
      });
    }, 8000);

    return () => window.clearInterval(timer);
  }, [autoScan, settings.watchlist]);

  function selectSymbol(symbol: string, index: number) {
    setScanIndex(index);
    setFocusedSymbol(symbol);
  }

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
              <span className="rounded border border-line bg-panel2 px-3 py-1 text-xs text-slate-300">
                Tick {pulse.toString().padStart(2, "0")}
              </span>
            </div>
            <h2 className="text-3xl font-semibold text-white lg:text-4xl">AI Trading Command Center</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300 lg:text-base">
              A live-data research cockpit for fake-money decision testing. Click watchlist symbols, scan the panels, and
              refresh Polygon bars without touching a brokerage account.
            </p>
          </div>
          <div className="grid min-w-[280px] gap-3 rounded border border-line bg-panel2/80 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Feed status</span>
              <span className={marketError ? "text-sm font-semibold text-danger" : "text-sm font-semibold text-mint"}>{status}</span>
            </div>
            <div className="rounded border border-line bg-ink/70 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Focused price</p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <span className="text-2xl font-semibold text-white">{latestPrice ? money.format(latestPrice) : "--"}</span>
                <span className={priceChange >= 0 ? "text-sm font-semibold text-mint" : "text-sm font-semibold text-danger"}>
                  {priceChange >= 0 ? "+" : ""}{priceChangePercent.toFixed(2)}%
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">{marketUpdatedAt ? `Updated ${new Date(marketUpdatedAt).toLocaleTimeString()}` : "Waiting for first refresh"}</p>
            </div>
            <button
              type="button"
              onClick={() => loadMarket(focusedSymbol)}
              disabled={isLoadingMarket}
              className="inline-flex items-center justify-center gap-2 rounded border border-line bg-ink px-3 py-2 text-sm text-slate-200 transition hover:border-cyan hover:text-white disabled:opacity-60"
            >
              {isLoadingMarket ? <Loader2 className="animate-spin" size={16} /> : <RefreshCcw size={16} />}
              Refresh {focusedSymbol}
            </button>
            <button
              type="button"
              onClick={() => setAutoScan((value) => !value)}
              className="inline-flex items-center justify-center gap-2 rounded border border-cyan/40 bg-cyan/10 px-3 py-2 text-sm font-semibold text-cyan transition hover:bg-cyan hover:text-ink"
            >
              {autoScan ? <Pause size={16} /> : <Play size={16} />}
              {autoScan ? "Pause Auto Scan" : "Start Auto Scan"}
            </button>
            <RunResearchButton compact />
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-line bg-ink/40 p-4 lg:border-b-0 lg:border-r">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-500">Watchlist</p>
          <div className="grid gap-2">
            {settings.watchlist.map((symbol, index) => (
              <button
                key={symbol}
                type="button"
                onClick={() => selectSymbol(symbol, index)}
                className={`flex items-center justify-between rounded border px-3 py-2 text-sm transition ${
                  focusedSymbol === symbol
                    ? "border-cyan bg-cyan/10 text-white"
                    : "border-line bg-panel/70 text-slate-300 hover:border-cyan/60"
                }`}
              >
                <span className="font-semibold">{symbol}</span>
                <span className="text-xs text-slate-500">{focusedSymbol === symbol ? (isLoadingMarket ? "Loading" : "Selected") : "Scan"}</span>
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

          {marketError ? (
            <div className="mb-5 rounded border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
              {marketError}
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
                <MiniChart values={marketCandles} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <PanelStat id="equity" selected={selectedPanel} onSelect={setSelectedPanel} icon={<Activity size={18} />} label="Fake equity" value={money.format(metrics.equity)} detail="Simulation balance" pulse={pulse} />
                <PanelStat id="target" selected={selectedPanel} onSelect={setSelectedPanel} icon={<Target size={18} />} label="Daily target" value={money.format(targetDollars)} detail={`${settings.dailyTargetPercent}% stretch goal`} pulse={pulse} />
                <PanelStat id="daily" selected={selectedPanel} onSelect={setSelectedPanel} icon={<Sparkles size={18} />} label="Daily P/L" value={money.format(metrics.dailyPnl)} detail={`${metrics.dailyPnlPercent}% today`} pulse={pulse} />
                <PanelStat id="win" selected={selectedPanel} onSelect={setSelectedPanel} icon={<Zap size={18} />} label="Win rate" value={`${metrics.winRate}%`} detail="Closed paper trades" pulse={pulse} />
              </div>
            </div>
          ) : null}

          {activeTab === "Risk" ? (
            <div className="grid gap-4 md:grid-cols-3">
              <PanelStat id="risk" selected={selectedPanel} onSelect={setSelectedPanel} icon={<ShieldCheck size={18} />} label="Risk per trade" value={`${settings.riskPerTradePercent}%`} detail="Default paper risk cap" pulse={pulse} />
              <PanelStat id="loss" selected={selectedPanel} onSelect={setSelectedPanel} icon={<Gauge size={18} />} label="Max daily loss" value={`${settings.maxDailyLossPercent}%`} detail={metrics.tradingHalted ? "Trading halted" : "Guardrail active"} pulse={pulse} />
              <PanelStat id="cap" selected={selectedPanel} onSelect={setSelectedPanel} icon={<Target size={18} />} label="Never all-in" value="25-35%" detail="Position sizing cap" pulse={pulse} />
              <div className="rounded border border-line bg-ink/60 p-4 md:col-span-3">
                <p className="text-sm leading-6 text-slate-300">
                  Selected panel: <span className="font-semibold text-cyan">{selectedPanel}</span>. The simulator keeps trades fake,
                  sizes positions from risk settings, and blocks trading when daily loss rules are hit. The 20% target is a stretch marker only.
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

function PanelStat({
  id,
  selected,
  onSelect,
  icon,
  label,
  value,
  detail,
  pulse
}: {
  id: PanelKey;
  selected: PanelKey;
  onSelect: (id: PanelKey) => void;
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  pulse: number;
}) {
  const isSelected = selected === id;
  const activity = 48 + Math.round(Math.abs(Math.sin((pulse + id.length) / 2)) * 49);

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`rounded border p-4 text-left transition ${
        isSelected ? "border-cyan bg-cyan/10 shadow-glow" : "border-line bg-ink/60 hover:border-cyan/50 hover:bg-panel2/70"
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded border border-cyan/30 bg-cyan/10 text-cyan">{icon}</div>
        <span className="text-xs text-slate-500">{activity}% active</span>
      </div>
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{detail}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded bg-ink ring-1 ring-line">
        <div className="h-full rounded bg-cyan transition-all duration-500" style={{ width: `${activity}%` }} />
      </div>
    </button>
  );
}
