import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, Brain, Briefcase, KeyRound, Newspaper, RefreshCw, Search, Settings, ShieldAlert, Wallet, Zap } from 'lucide-react';
import type { AiRecommendation, ApiKeys, MarketQuote, NewsItem, PaperAccount, RiskSettings } from './types';
import { defaultSettings, hasAnyMarketKey, hasPrimaryScannerKey, loadSettings, saveSettings, type PersistedSettings } from './lib/config';
import { getMarketNews, getQuotes, scanPennyStocks } from './lib/marketData';
import { rankOpportunities } from './lib/aiEngine';
import { accountEquity, buy, loadAccount, markToMarket, saveAccount, sell, unrealizedPl } from './lib/paperTrading';
import { currency, pct } from './lib/technicals';
import { supabaseEnabled } from './lib/supabase';

type View = 'dashboard' | 'scanner' | 'research' | 'paper' | 'settings';

const nav: Array<{ id: View; label: string; icon: typeof Activity }> = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'scanner', label: 'Scanner', icon: Search },
  { id: 'research', label: 'AI Research', icon: Brain },
  { id: 'paper', label: 'Paper Trading', icon: Wallet },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [settings, setSettings] = useState<PersistedSettings>(() => loadSettings());
  const [account, setAccount] = useState<PaperAccount>(() => loadAccount(loadSettings().risk.startingCash));
  const [scanner, setScanner] = useState<MarketQuote[]>([]);
  const [watchQuotes, setWatchQuotes] = useState<MarketQuote[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  const recommendations = useMemo(() => rankOpportunities(scanner.length ? scanner : watchQuotes, news), [scanner, watchQuotes, news]);
  const markedAccount = useMemo(() => markToMarket(account, [...scanner, ...watchQuotes]), [account, scanner, watchQuotes]);
  const equity = accountEquity(markedAccount);
  const openPl = unrealizedPl(markedAccount);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveAccount(markedAccount);
  }, [markedAccount]);

  async function refreshAll() {
    if (!hasAnyMarketKey(settings.apiKeys)) return;
    setLoading(true);
    setMessage('');
    try {
      const watch = await getQuotes(settings.watchlist, settings.apiKeys);
      setWatchQuotes(watch);
      const newsRows = await getMarketNews(settings.apiKeys, settings.watchlist);
      setNews(newsRows);
      if (hasPrimaryScannerKey(settings.apiKeys)) {
        const rows = await scanPennyStocks(settings.apiKeys, settings.risk.scannerMaxPrice, settings.risk.minVolume);
        setScanner(rows);
      }
      setMessage('Market data refreshed from configured providers.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to refresh market data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hasAnyMarketKey(settings.apiKeys)) {
    return <SetupScreen settings={settings} setSettings={setSettings} onReady={() => void refreshAll()} />;
  }

  return (
    <div className="min-h-screen bg-terminal-bg text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-terminal-line bg-black/30 p-5 backdrop-blur-xl lg:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-terminal-cyan/40 bg-terminal-cyan/10 text-terminal-cyan"><Zap size={22} /></div>
          <div>
            <div className="text-sm uppercase tracking-[0.24em] text-slate-400">AI Penny</div>
            <div className="text-lg font-black">Trading Terminal</div>
          </div>
        </div>
        <nav className="space-y-2">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setView(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${view === item.id ? 'bg-terminal-cyan/15 text-terminal-cyan shadow-glow' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <Icon size={18} /> {item.label}
              </button>
            );
          })}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-terminal-line bg-terminal-panel p-4 text-xs text-slate-400">
          <div className="mb-2 flex items-center gap-2 text-terminal-green"><ShieldAlert size={16} /> Paper trading only</div>
          Uses configured market providers only. No fake prices are generated.
        </div>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-terminal-line bg-terminal-bg/88 px-5 py-4 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Production Terminal</div>
              <h1 className="text-2xl font-black text-white">AI Penny Stock Research & Paper Trading</h1>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill label={supabaseEnabled ? 'Supabase connected' : 'Supabase setup needed'} tone={supabaseEnabled ? 'green' : 'amber'} />
              <StatusPill label={hasPrimaryScannerKey(settings.apiKeys) ? 'FMP primary' : 'FMP key missing'} tone={hasPrimaryScannerKey(settings.apiKeys) ? 'green' : 'red'} />
              <button onClick={() => void refreshAll()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-terminal-line bg-terminal-card px-4 py-2 text-sm font-bold text-white hover:border-terminal-cyan disabled:opacity-50">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
          </div>
          {message && <div className="mt-3 rounded-xl border border-terminal-line bg-terminal-panel px-4 py-2 text-sm text-slate-300">{message}</div>}
        </header>

        <div className="grid gap-5 p-5">
          {view === 'dashboard' && <Dashboard equity={equity} account={markedAccount} openPl={openPl} recommendations={recommendations} watchQuotes={watchQuotes} news={news} />}
          {view === 'scanner' && <Scanner rows={scanner} canScan={hasPrimaryScannerKey(settings.apiKeys)} loading={loading} onRefresh={() => void refreshAll()} />}
          {view === 'research' && <Research recommendations={recommendations} />}
          {view === 'paper' && <PaperTrading account={markedAccount} recommendations={recommendations} onBuy={(rec) => setAccount(buy(markedAccount, rec.quote, Math.min(equity * settings.risk.maxPositionPct, markedAccount.cash), rec.confidence, rec.thesis))} onSell={(quote) => {
            const position = markedAccount.positions.find((p) => p.symbol === quote.symbol);
            if (position) setAccount(sell(markedAccount, quote, position.quantity, undefined, 'Manual paper exit'));
          }} />}
          {view === 'settings' && <SettingsPanel settings={settings} setSettings={setSettings} onReset={() => { const fresh = { cash: settings.risk.startingCash, positions: [], trades: [] }; setAccount(fresh); saveAccount(fresh); }} />}
        </div>
      </main>
    </div>
  );
}

function SetupScreen({ settings, setSettings, onReady }: { settings: PersistedSettings; setSettings: (settings: PersistedSettings) => void; onReady: () => void }) {
  const [draft, setDraft] = useState(settings.apiKeys);
  return (
    <div className="grid min-h-screen place-items-center bg-terminal-bg p-6 text-slate-100">
      <div className="w-full max-w-3xl rounded-3xl border border-terminal-line bg-terminal-panel p-8 shadow-glow">
        <div className="mb-6 flex items-center gap-3 text-terminal-cyan"><KeyRound /> API setup required</div>
        <h1 className="text-4xl font-black text-white">Connect real market data before using the terminal.</h1>
        <p className="mt-4 text-slate-400">This app does not generate fake market prices. Add at least one provider key. FMP is required for the full U.S. penny stock scanner; Finnhub and Alpha Vantage are used as quote/news fallbacks.</p>
        <div className="mt-8 grid gap-4">
          <KeyInput label="Financial Modeling Prep API Key" value={draft.fmp || ''} onChange={(value) => setDraft({ ...draft, fmp: value })} />
          <KeyInput label="Finnhub API Key" value={draft.finnhub || ''} onChange={(value) => setDraft({ ...draft, finnhub: value })} />
          <KeyInput label="Alpha Vantage API Key" value={draft.alphaVantage || ''} onChange={(value) => setDraft({ ...draft, alphaVantage: value })} />
        </div>
        <button className="mt-8 rounded-xl bg-terminal-cyan px-5 py-3 font-black text-black" onClick={() => { setSettings({ ...settings, apiKeys: draft }); onReady(); }}>Save keys and open terminal</button>
      </div>
    </div>
  );
}

function Dashboard({ equity, account, openPl, recommendations, watchQuotes, news }: { equity: number; account: PaperAccount; openPl: number; recommendations: AiRecommendation[]; watchQuotes: MarketQuote[]; news: NewsItem[] }) {
  return <>
    <div className="grid gap-4 md:grid-cols-4">
      <Metric title="Equity" value={currency(equity)} accent="cyan" />
      <Metric title="Cash" value={currency(account.cash)} accent="green" />
      <Metric title="Open P/L" value={currency(openPl)} accent={openPl >= 0 ? 'green' : 'red'} />
      <Metric title="Open Positions" value={String(account.positions.length)} accent="amber" />
    </div>
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <Panel title="Top AI Opportunities" icon={Brain}><RecommendationTable rows={recommendations.slice(0, 8)} /></Panel>
      <Panel title="Watchlist Quotes" icon={BarChart3}><QuoteList rows={watchQuotes} /></Panel>
    </div>
    <Panel title="Market News" icon={Newspaper}><NewsList rows={news} /></Panel>
  </>;
}

function Scanner({ rows, canScan, loading, onRefresh }: { rows: MarketQuote[]; canScan: boolean; loading: boolean; onRefresh: () => void }) {
  if (!canScan) return <Empty title="FMP key required" text="The scanner needs Financial Modeling Prep to discover U.S. stocks under $5. Add your FMP key in Settings." />;
  return <Panel title="Penny Stock Scanner" icon={Search} action={<button onClick={onRefresh} className="rounded-lg border border-terminal-line px-3 py-2 text-sm font-bold">{loading ? 'Scanning...' : 'Run scan'}</button>}><QuoteList rows={rows} /></Panel>;
}

function Research({ recommendations }: { recommendations: AiRecommendation[] }) {
  return <div className="grid gap-4">{recommendations.map((rec) => <div key={rec.symbol} className="rounded-2xl border border-terminal-line bg-terminal-panel p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-2xl font-black text-white">{rec.symbol} <span className="text-sm font-medium text-slate-500">{rec.name}</span></div><p className="mt-2 max-w-3xl text-slate-300">{rec.thesis}</p></div><div className="text-right"><div className="text-3xl font-black text-terminal-cyan">{rec.score.toFixed(0)}</div><div className="text-xs uppercase text-slate-500">AI score</div></div></div><div className="mt-4 grid gap-3 md:grid-cols-4"><Metric title="Confidence" value={`${rec.confidence.toFixed(0)}%`} accent="cyan" /><Metric title="RVOL" value={`${rec.technicals.relativeVolume.toFixed(2)}x`} accent="amber" /><Metric title="RSI" value={rec.technicals.rsi.toFixed(0)} accent="green" /><Metric title="Action" value={rec.action} accent={rec.action === 'Avoid' ? 'red' : 'green'} /></div><p className="mt-4 text-sm text-terminal-amber">{rec.riskNotes}</p></div>)}</div>;
}

function PaperTrading({ account, recommendations, onBuy, onSell }: { account: PaperAccount; recommendations: AiRecommendation[]; onBuy: (rec: AiRecommendation) => void; onSell: (quote: MarketQuote) => void }) {
  return <div className="grid gap-5 xl:grid-cols-2"><Panel title="Paper Buy Candidates" icon={Briefcase}>{recommendations.slice(0, 8).map((rec) => <div key={rec.symbol} className="mb-3 flex items-center justify-between rounded-xl border border-terminal-line bg-black/20 p-3"><div><div className="font-black text-white">{rec.symbol}</div><div className="text-sm text-slate-400">{currency(rec.quote.price)} | Confidence {rec.confidence.toFixed(0)}%</div></div><button onClick={() => onBuy(rec)} className="rounded-lg bg-terminal-green px-3 py-2 text-sm font-black text-black">Paper buy</button></div>)}</Panel><Panel title="Positions & History" icon={Wallet}><div className="space-y-3">{account.positions.map((position) => <div key={position.symbol} className="flex items-center justify-between rounded-xl border border-terminal-line p-3"><div><div className="font-black text-white">{position.symbol}</div><div className="text-sm text-slate-400">Qty {position.quantity.toFixed(4)} @ {currency(position.averagePrice)}</div></div><button onClick={() => onSell({ symbol: position.symbol, price: position.lastPrice, changePercent: 0, volume: 0, provider: 'FMP', fetchedAt: new Date().toISOString() })} className="rounded-lg border border-terminal-red px-3 py-2 text-sm font-black text-terminal-red">Exit</button></div>)}{account.trades.slice(0, 12).map((trade) => <div key={trade.id} className="flex justify-between text-sm text-slate-400"><span>{trade.side} {trade.symbol}</span><span>{trade.quantity.toFixed(4)} @ {currency(trade.price)}</span></div>)}</div></Panel></div>;
}

function SettingsPanel({ settings, setSettings, onReset }: { settings: PersistedSettings; setSettings: (settings: PersistedSettings) => void; onReset: () => void }) {
  const setKeys = (apiKeys: ApiKeys) => setSettings({ ...settings, apiKeys });
  const setRisk = (risk: RiskSettings) => setSettings({ ...settings, risk });
  return <div className="grid gap-5 xl:grid-cols-2"><Panel title="Provider Keys" icon={KeyRound}><KeyInput label="FMP" value={settings.apiKeys.fmp || ''} onChange={(fmp) => setKeys({ ...settings.apiKeys, fmp })} /><KeyInput label="Finnhub" value={settings.apiKeys.finnhub || ''} onChange={(finnhub) => setKeys({ ...settings.apiKeys, finnhub })} /><KeyInput label="Alpha Vantage" value={settings.apiKeys.alphaVantage || ''} onChange={(alphaVantage) => setKeys({ ...settings.apiKeys, alphaVantage })} /></Panel><Panel title="Risk Management" icon={ShieldAlert}><NumberInput label="Scanner max price" value={settings.risk.scannerMaxPrice} onChange={(scannerMaxPrice) => setRisk({ ...settings.risk, scannerMaxPrice })} /><NumberInput label="Minimum volume" value={settings.risk.minVolume} onChange={(minVolume) => setRisk({ ...settings.risk, minVolume })} /><NumberInput label="Max position %" value={settings.risk.maxPositionPct} step={0.01} onChange={(maxPositionPct) => setRisk({ ...settings.risk, maxPositionPct })} /><button onClick={onReset} className="mt-3 rounded-xl border border-terminal-red px-4 py-2 font-bold text-terminal-red">Reset paper account</button></Panel></div>;
}

function Panel({ title, icon: Icon, children, action }: { title: string; icon: typeof Activity; children: React.ReactNode; action?: React.ReactNode }) {
  return <section className="rounded-2xl border border-terminal-line bg-terminal-panel p-5 shadow-glow"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-black text-white"><Icon size={19} className="text-terminal-cyan" /> {title}</h2>{action}</div>{children}</section>;
}

function Metric({ title, value, accent }: { title: string; value: string; accent: 'cyan' | 'green' | 'red' | 'amber' }) {
  const color = accent === 'green' ? 'text-terminal-green' : accent === 'red' ? 'text-terminal-red' : accent === 'amber' ? 'text-terminal-amber' : 'text-terminal-cyan';
  return <div className="rounded-2xl border border-terminal-line bg-terminal-panel p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</div><div className={`mt-2 text-2xl font-black ${color}`}>{value}</div></div>;
}

function StatusPill({ label, tone }: { label: string; tone: 'green' | 'amber' | 'red' }) {
  const color = tone === 'green' ? 'border-terminal-green/40 text-terminal-green' : tone === 'red' ? 'border-terminal-red/40 text-terminal-red' : 'border-terminal-amber/40 text-terminal-amber';
  return <span className={`rounded-full border px-3 py-1 text-xs font-bold ${color}`}>{label}</span>;
}

function QuoteList({ rows }: { rows: MarketQuote[] }) {
  if (!rows.length) return <Empty title="No real quotes loaded" text="Refresh after configuring provider keys. The app will not display fake market rows." />;
  return <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-slate-500"><tr><th className="py-2">Symbol</th><th>Price</th><th>Change</th><th>Volume</th><th>Provider</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.symbol}-${row.provider}`} className="border-t border-terminal-line"><td className="py-3 font-black text-white">{row.symbol}</td><td>{currency(row.price)}</td><td className={row.changePercent >= 0 ? 'text-terminal-green' : 'text-terminal-red'}>{pct(row.changePercent)}</td><td>{row.volume.toLocaleString()}</td><td>{row.provider}</td></tr>)}</tbody></table></div>;
}

function RecommendationTable({ rows }: { rows: AiRecommendation[] }) {
  if (!rows.length) return <Empty title="No recommendations yet" text="Run the scanner or refresh watchlist data to generate AI rankings." />;
  return <div className="space-y-2">{rows.map((row) => <div key={row.symbol} className="flex items-center justify-between rounded-xl border border-terminal-line bg-black/20 p-3"><div><div className="font-black text-white">{row.symbol}</div><div className="text-xs text-slate-500">{row.action}</div></div><div className="text-right"><div className="font-black text-terminal-cyan">{row.score.toFixed(0)}</div><div className="text-xs text-slate-500">{row.confidence.toFixed(0)}% conf.</div></div></div>)}</div>;
}

function NewsList({ rows }: { rows: NewsItem[] }) {
  if (!rows.length) return <Empty title="No provider news loaded" text="News appears after a successful FMP or Finnhub request." />;
  return <div className="grid gap-3 md:grid-cols-2">{rows.slice(0, 10).map((item) => <a key={`${item.url}-${item.title}`} href={item.url} target="_blank" rel="noreferrer" className="rounded-xl border border-terminal-line bg-black/20 p-4 hover:border-terminal-cyan"><div className="text-xs uppercase text-slate-500">{item.source} | {item.sentiment}</div><div className="mt-2 font-bold text-white">{item.title}</div></a>)}</div>;
}

function Empty({ title, text }: { title: string; text: string }) {
  return <div className="rounded-xl border border-dashed border-terminal-line p-6 text-center"><div className="font-black text-white">{title}</div><p className="mt-2 text-sm text-slate-500">{text}</p></div>;
}

function KeyInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-slate-300">{label}</span><input type="password" value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-terminal-line bg-black/30 px-4 py-3 text-white outline-none focus:border-terminal-cyan" placeholder="Paste API key" /></label>;
}

function NumberInput({ label, value, onChange, step = 1 }: { label: string; value: number; step?: number; onChange: (value: number) => void }) {
  return <label className="mb-3 block"><span className="mb-2 block text-sm font-bold text-slate-300">{label}</span><input type="number" step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full rounded-xl border border-terminal-line bg-black/30 px-4 py-3 text-white outline-none focus:border-terminal-cyan" /></label>;
}
