import { AlertTriangle, BrainCircuit, RadioTower } from "lucide-react";
import { RunResearchButton } from "@/components/RunResearchButton";
import { TradeTable } from "@/components/TradeTable";
import { WarningBanner } from "@/components/WarningBanner";
import { runDailyResearch } from "@/lib/researchAgent";
import { readAccount } from "@/lib/store";

export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default async function ResearchPage() {
  const account = await readAccount();

  try {
    const research = await runDailyResearch(account.settings);

    return (
      <>
        <WarningBanner />
        <section className="mb-6 overflow-hidden rounded border border-cyan/20 bg-panel/90 shadow-glow">
          <div className="border-b border-line bg-ink/70 p-5 lg:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded border border-mint/30 bg-mint/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-mint">
                  <RadioTower size={14} /> Live Market Study
                </div>
                <h2 className="text-3xl font-semibold text-white">{research.headline}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{research.summary}</p>
              </div>
              <RunResearchButton />
            </div>
          </div>
          <div className="grid gap-3 p-5 md:grid-cols-3 lg:p-6">
            {research.keyTakeaways.map((takeaway) => (
              <div key={takeaway} className="rounded border border-line bg-ink/60 p-4 text-sm leading-6 text-slate-300">
                {takeaway}
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6 grid gap-4 lg:grid-cols-2">
          {research.analyses.map((analysis) => (
            <article key={analysis.symbol} className="group rounded border border-line bg-panel/90 p-5 shadow-glow transition hover:border-cyan/50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{analysis.assetType}</p>
                  <h3 className="mt-1 text-2xl font-semibold text-white">{analysis.symbol}</h3>
                </div>
                <span className="rounded border border-cyan/30 bg-cyan/10 px-3 py-1 text-sm font-semibold text-cyan">
                  {analysis.idea.action.toUpperCase()}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">{analysis.notes}</p>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <Stat label="Current" value={money.format(analysis.currentPrice)} />
                <Stat label="Trend" value={analysis.trend} />
                <Stat label="MA 5 / MA 20" value={`${analysis.movingAverages.ma5} / ${analysis.movingAverages.ma20}`} />
                <Stat label="RSI" value={`${analysis.rsi}`} />
                <Stat label="MACD hist." value={`${analysis.macd.histogram}`} />
                <Stat label="Risk/reward" value={`${analysis.riskReward}:1`} />
                <Stat label="Sentiment" value={analysis.sentiment} />
                <Stat label="Confidence" value={`${analysis.idea.confidence}%`} />
              </dl>
              <p className="mt-4 rounded border border-line bg-ink/60 p-3 text-sm leading-6 text-slate-300">{analysis.idea.reason}</p>
            </article>
          ))}
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">Generated Paper Trade Ideas</h2>
          <div className="overflow-x-auto">
            <TradeTable trades={research.analyses.map((analysis) => analysis.idea)} />
          </div>
        </section>
      </>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Live market data is unavailable.";

    return (
      <>
        <WarningBanner />
        <section className="rounded border border-danger/40 bg-panel/90 p-6 shadow-glow">
          <div className="flex max-w-3xl gap-4">
            <AlertTriangle className="mt-1 shrink-0 text-danger" size={28} />
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-danger">Live data blocked</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Research is waiting for fresh Polygon bars</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{message}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {account.settings.watchlist.map((symbol) => (
                  <span key={symbol} className="rounded border border-line bg-ink px-3 py-1 text-sm text-slate-300">
                    {symbol}
                  </span>
                ))}
              </div>
              <div className="mt-6">
                <RunResearchButton />
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line bg-ink/60 p-3 transition group-hover:border-cyan/30">
      <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold capitalize text-white">{value}</dd>
    </div>
  );
}
