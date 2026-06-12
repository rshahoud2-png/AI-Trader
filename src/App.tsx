import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Activity, BarChart3, Brain, Briefcase, CheckCircle2, Database, KeyRound, Newspaper, RefreshCw, Search, Settings, ShieldAlert, Wallet, XCircle, Zap } from 'lucide-react';
import type { AiRecommendation, MarketQuote, NewsItem, PaperAccount, RiskSettings } from './types';
import { loadSettings, saveSettings, type PersistedSettings } from './lib/config';
import { getMarketNews, getQuotes, scanPennyStocks } from './lib/marketData';
import { rankOpportunities } from './lib/aiEngine';
import { accountEquity, buy, loadAccount, markToMarket, saveAccount, sell, unrealizedPl } from './lib/paperTrading';
import { apiUrl } from './lib/runtime';
import { currency, pct } from './lib/technicals';

type View = 'dashboard' | 'scanner' | 'research' | 'paper' | 'status' | 'settings';
type Tone = 'good' | 'warn' | 'bad' | 'info';

type ProviderHealth = {
  configured: boolean;
  connected: boolean;
  message: string;
};

type DeploymentStatus = {
  supabase: {
    configured: boolean;
    connected: boolean;
    tables: Record<string, { exists: boolean; message: string }>;
  };
  providers: {
    fmp: boolean;
    finnhub: boolean;
    alphaVantage: boolean;
  };
  providerHealth?: {
    fmp?: ProviderHealth;
    finnhub?: ProviderHealth;
    alphaVantage?: ProviderHealth;
  };
  env: Record<string, boolean>;
};

const nav: Array<{ id: View; label: string; icon: typeof Activity }> = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'scanner', label: 'Scanner', icon: Search },
  { id: 'research', label: 'AI Research', icon: Brain },
  { id: 'paper', label: 'Paper Trading', icon: Wallet },
  { id: 'status', label: 'Setup Status', icon: Database },
  { id: 'settings', label: 'Settings', icon: Settings }
];

const requiredTables = ['profiles', 'paper_accounts', 'watchlists', 'paper_trades', 'paper_positions', 'ai_recommendations', 'daily_market_reports', 'market_data_cache', 'app_settings'];

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [settings, setSettings] = useState<PersistedSettings>(() => loadSettings());
  const [status, setStatus] = useState<DeploymentStatus | null>(null);
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
  const hasAnyProvider = Boolean(status?.providers.fmp || status?.providers.finnhub || status?.providers.alphaVantage);
  const hasFmp = Boolean(status?.providers.fmp);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveAccount(markedAccount);
  }, [markedAccount]);

  async function refreshStatus() {
    try {
      const response = await fetch(apiUrl('/api/status'), { headers: { accept: 'application/json' } });
      if (!response.ok) throw new Error(`Status API failed with HTTP ${response.status}`);
      const payload = await response.json() as DeploymentStatus;
      setStatus(payload);
      return payload;
    } catch (error) {
      const fallback: DeploymentStatus = {
        supabase: { configured: false, connected: false, tables: {} },
        providers: { fmp: false, finnhub: false, alphaVantage: false },
        env: {}
      };
      setStatus(fallback);
      setMessage(error instanceof Error ? error.message : 'Unable to load deployment status.');
      return fallback;
    }
  }

  async function refreshAll() {
    setLoading(true);
    setMessage('');
    try {
      const current = await refreshStatus();
      const providerReady = current.providers.fmp || current.providers.finnhub || current.providers.alphaVantage;
      if (!providerReady) {
        setScanner([]);
        setWatchQuotes([]);
        setNews([]);
        setView('status');
        setMessage('Market data is not connected yet. Fix the FMP key or add a fallback provider in Vercel, then redeploy.');
        return;
      }

      const watch = await getQuotes(settings.watchlist, settings.apiKeys);
      setWatchQuotes(watch);
      setNews(await getMarketNews(settings.apiKeys, settings.watchlist));
      setScanner(current.providers.fmp ? await scanPennyStocks(settings.apiKeys, settings.risk.scannerMaxPrice, settings.risk.minVolume) : []);
      setMessage('Live provider data refreshed through the Vercel API proxy.');
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

  return (
    <div className="terminal-shell">
      <aside className="terminal-sidebar">
        <div className="brand-block">
          <div className="brand-mark"><Zap size={20} /></div>
          <div>
            <div className="brand-kicker">AI Penny</div>
            <div className="brand-title">Trading Terminal</div>
          </div>
        </div>

        <nav className="nav-stack">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => setView(item.id)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="side-note">
          <ShieldAlert size={17} />
          <div>
            <strong>Paper trading only</strong>
            <span>No fake market prices. Provider keys control the data feed.</span>
          </div>
        </div>
      </aside>

      <main className="terminal-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Production Terminal</p>
            <h1>AI Penny Stock Research & Paper Trading</h1>
          </div>
          <div className="topbar-actions">
            <StatusPill label={status?.supabase.connected ? 'Supabase connected' : 'Supabase setup'} tone={status?.supabase.connected ? 'good' : 'warn'} />
            <StatusPill label={hasFmp ? 'FMP connected' : 'FMP offline'} tone={hasFmp ? 'good' : 'bad'} />
            <StatusPill label={hasAnyProvider ? 'Market data ready' : 'No market provider'} tone={hasAnyProvider ? 'good' : 'bad'} />
            <button className="button primary" onClick={() => void refreshAll()} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              Refresh
            </button>
          </div>
        </header>

        {message && <div className="message-bar">{message}</div>}

        <section className="workspace">
          {view === 'dashboard' && <Dashboard status={status} equity={equity} account={markedAccount} openPl={openPl} recommendations={recommendations} watchQuotes={watchQuotes} news={news} onStatus={() => setView('status')} />}
          {view === 'scanner' && <Scanner rows={scanner} canScan={hasFmp} loading={loading} onRefresh={() => void refreshAll()} />}
          {view === 'research' && <Research recommendations={recommendations} />}
          {view === 'paper' && <PaperTrading account={markedAccount} recommendations={recommendations} onBuy={(rec) => setAccount(buy(markedAccount, rec.quote, Math.min(equity * settings.risk.maxPositionPct, markedAccount.cash), rec.confidence, rec.thesis))} onSell={(quote) => { const position = markedAccount.positions.find((p) => p.symbol === quote.symbol); if (position) setAccount(sell(markedAccount, quote, position.quantity, undefined, 'Manual paper exit')); }} />}
          {view === 'status' && <SetupStatus status={status} onRefresh={() => void refreshAll()} />}
          {view === 'settings' && <SettingsPanel settings={settings} setSettings={setSettings} onReset={() => { const fresh = { cash: settings.risk.startingCash, positions: [], trades: [] }; setAccount(fresh); saveAccount(fresh); }} />}
        </section>
      </main>
    </div>
  );
}

function Dashboard({ status, equity, account, openPl, recommendations, watchQuotes, news, onStatus }: { status: DeploymentStatus | null; equity: number; account: PaperAccount; openPl: number; recommendations: AiRecommendation[]; watchQuotes: MarketQuote[]; news: NewsItem[]; onStatus: () => void }) {
  const providerReady = Boolean(status?.providers.fmp || status?.providers.finnhub || status?.providers.alphaVantage);
  return <>
    {!providerReady && <Callout title="Market data needs attention" text="Supabase is connected, but no market provider is currently returning data. Fix the FMP key or add Finnhub/Alpha Vantage in Vercel." action={<button className="button" onClick={onStatus}>Open setup status</button>} />}
    <div className="metric-grid">
      <Metric title="Paper equity" value={currency(equity)} tone="info" />
      <Metric title="Cash" value={currency(account.cash)} tone="good" />
      <Metric title="Open P/L" value={currency(openPl)} tone={openPl >= 0 ? 'good' : 'bad'} />
      <Metric title="Open positions" value={String(account.positions.length)} tone="warn" />
    </div>
    <div className="two-column">
      <Panel title="AI Opportunity Queue" icon={Brain}><RecommendationTable rows={recommendations.slice(0, 7)} /></Panel>
      <Panel title="Watchlist Feed" icon={BarChart3}><QuoteList rows={watchQuotes} /></Panel>
    </div>
    <Panel title="Market News" icon={Newspaper}><NewsList rows={news} /></Panel>
  </>;
}

function SetupStatus({ status, onRefresh }: { status: DeploymentStatus | null; onRefresh: () => void }) {
  const tables = status?.supabase.tables || {};
  return <div className="stack">
    <Panel title="Deployment Setup Status" icon={Database} action={<button onClick={onRefresh} className="button">Recheck</button>}>
      <div className="connection-grid">
        <ConnectionCard title="Supabase" ready={Boolean(status?.supabase.connected)} detail={status?.supabase.configured ? 'Connected and tables are reachable.' : 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.'} />
        <ConnectionCard title="FMP" ready={Boolean(status?.providers.fmp)} detail={status?.providerHealth?.fmp?.message || 'Primary scanner provider.'} />
        <ConnectionCard title="Finnhub" ready={Boolean(status?.providers.finnhub)} detail={status?.providerHealth?.finnhub?.message || 'Fallback quotes and news.'} />
        <ConnectionCard title="Alpha Vantage" ready={Boolean(status?.providers.alphaVantage)} detail={status?.providerHealth?.alphaVantage?.message || 'Fallback quote provider.'} />
      </div>
    </Panel>

    <Panel title="Database Tables" icon={Database}>
      <div className="table-check-grid">
        {requiredTables.map((table) => <div key={table} className="table-check"><span>{table}</span>{tables[table]?.exists ? <CheckCircle2 size={16} /> : <XCircle size={16} />}</div>)}
      </div>
    </Panel>
  </div>;
}

function Scanner({ rows, canScan, loading, onRefresh }: { rows: MarketQuote[]; canScan: boolean; loading: boolean; onRefresh: () => void }) {
  if (!canScan) return <Callout title="FMP is required for scanner discovery" text="The penny-stock scanner uses Financial Modeling Prep to discover U.S. stocks under your max price and volume filters. Your current FMP key is missing, invalid, or plan-restricted." action={<button className="button primary" onClick={onRefresh}>{loading ? 'Checking...' : 'Recheck provider'}</button>} />;
  return <Panel title="Penny Stock Scanner" icon={Search} action={<button onClick={onRefresh} className="button primary">{loading ? 'Scanning...' : 'Run scan'}</button>}><QuoteList rows={rows} /></Panel>;
}

function Research({ recommendations }: { recommendations: AiRecommendation[] }) {
  if (!recommendations.length) return <Empty title="No AI rankings yet" text="Load provider-backed quotes or run the FMP scanner to generate opportunity rankings." />;
  return <div className="research-list">{recommendations.map((rec) => <article key={rec.symbol} className="research-card">
    <div className="research-head">
      <div><p className="symbol-line">{rec.symbol} <span>{rec.name}</span></p><p className="research-thesis">{rec.thesis}</p></div>
      <Score score={rec.score} />
    </div>
    <div className="mini-metrics">
      <Metric title="Confidence" value={`${rec.confidence.toFixed(0)}%`} tone="info" />
      <Metric title="RVOL" value={`${rec.technicals.relativeVolume.toFixed(2)}x`} tone="warn" />
      <Metric title="RSI" value={rec.technicals.rsi.toFixed(0)} tone="good" />
      <Metric title="Action" value={rec.action} tone={rec.action === 'Avoid' ? 'bad' : 'good'} />
    </div>
    <p className="risk-note">{rec.riskNotes}</p>
  </article>)}</div>;
}

function PaperTrading({ account, recommendations, onBuy, onSell }: { account: PaperAccount; recommendations: AiRecommendation[]; onBuy: (rec: AiRecommendation) => void; onSell: (quote: MarketQuote) => void }) {
  return <div className="two-column even">
    <Panel title="Paper Buy Candidates" icon={Briefcase}>{recommendations.slice(0, 8).map((rec) => <div key={rec.symbol} className="trade-row"><div><strong>{rec.symbol}</strong><span>{currency(rec.quote.price)} | Confidence {rec.confidence.toFixed(0)}%</span></div><button onClick={() => onBuy(rec)} className="button success">Paper buy</button></div>)}</Panel>
    <Panel title="Positions & History" icon={Wallet}>
      <div className="stack compact">
        {account.positions.map((position) => <div key={position.symbol} className="trade-row"><div><strong>{position.symbol}</strong><span>Qty {position.quantity.toFixed(4)} @ {currency(position.averagePrice)}</span></div><button onClick={() => onSell({ symbol: position.symbol, price: position.lastPrice, changePercent: 0, volume: 0, provider: 'FMP', fetchedAt: new Date().toISOString() })} className="button danger">Exit</button></div>)}
        {account.trades.slice(0, 12).map((trade) => <div key={trade.id} className="history-row"><span>{trade.side} {trade.symbol}</span><span>{trade.quantity.toFixed(4)} @ {currency(trade.price)}</span></div>)}
        {!account.positions.length && !account.trades.length && <Empty title="No paper trades yet" text="AI-ranked candidates appear here after provider data is connected." />}
      </div>
    </Panel>
  </div>;
}

function SettingsPanel({ settings, setSettings, onReset }: { settings: PersistedSettings; setSettings: (settings: PersistedSettings) => void; onReset: () => void }) {
  const setRisk = (risk: RiskSettings) => setSettings({ ...settings, risk });
  return <div className="two-column even">
    <Panel title="Watchlist" icon={KeyRound}>
      <label className="field"><span>Symbols</span><input value={settings.watchlist.join(', ')} onChange={(event) => setSettings({ ...settings, watchlist: event.target.value.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean) })} /></label>
      <p className="muted">Provider keys are read from Vercel environment variables, not from the browser or desktop app.</p>
    </Panel>
    <Panel title="Risk Management" icon={ShieldAlert}>
      <NumberInput label="Scanner max price" value={settings.risk.scannerMaxPrice} onChange={(scannerMaxPrice) => setRisk({ ...settings.risk, scannerMaxPrice })} />
      <NumberInput label="Minimum volume" value={settings.risk.minVolume} onChange={(minVolume) => setRisk({ ...settings.risk, minVolume })} />
      <NumberInput label="Max position %" value={settings.risk.maxPositionPct} step={0.01} onChange={(maxPositionPct) => setRisk({ ...settings.risk, maxPositionPct })} />
      <button onClick={onReset} className="button danger">Reset paper account</button>
    </Panel>
  </div>;
}

function Panel({ title, icon: Icon, children, action }: { title: string; icon: typeof Activity; children: ReactNode; action?: ReactNode }) {
  return <section className="panel"><div className="panel-head"><h2><Icon size={18} /> {title}</h2>{action}</div>{children}</section>;
}

function Metric({ title, value, tone }: { title: string; value: string; tone: Tone }) {
  return <div className={`metric tone-${tone}`}><span>{title}</span><strong>{value}</strong></div>;
}

function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  return <span className={`status-pill tone-${tone}`}>{label}</span>;
}

function ConnectionCard({ title, ready, detail }: { title: string; ready: boolean; detail: string }) {
  return <div className={`connection-card ${ready ? 'ready' : 'blocked'}`}><div>{ready ? <CheckCircle2 size={18} /> : <XCircle size={18} />}<strong>{title}</strong></div><p>{detail}</p></div>;
}

function QuoteList({ rows }: { rows: MarketQuote[] }) {
  if (!rows.length) return <Empty title="No real quotes loaded" text="The provider API did not return rows. Check setup status and provider limits before trading." />;
  return <div className="table-wrap"><table><thead><tr><th>Symbol</th><th>Price</th><th>Change</th><th>Volume</th><th>Provider</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.symbol}-${row.provider}`}><td><strong>{row.symbol}</strong><span>{row.name}</span></td><td>{currency(row.price)}</td><td className={row.changePercent >= 0 ? 'positive' : 'negative'}>{pct(row.changePercent)}</td><td>{row.volume.toLocaleString()}</td><td>{row.provider}</td></tr>)}</tbody></table></div>;
}

function RecommendationTable({ rows }: { rows: AiRecommendation[] }) {
  if (!rows.length) return <Empty title="No recommendations yet" text="Real quotes are required before the AI scoring engine can rank opportunities." />;
  return <div className="rec-list">{rows.map((row) => <div key={row.symbol} className="rec-row"><div><strong>{row.symbol}</strong><span>{row.action}</span></div><Score score={row.score} /></div>)}</div>;
}

function NewsList({ rows }: { rows: NewsItem[] }) {
  if (!rows.length) return <Empty title="No provider news loaded" text="News appears after a successful FMP or Finnhub response." />;
  return <div className="news-grid">{rows.slice(0, 10).map((item) => <a key={`${item.url}-${item.title}`} href={item.url} target="_blank" rel="noreferrer" className="news-card"><span>{item.source} | {item.sentiment || 'neutral'}</span><strong>{item.title}</strong></a>)}</div>;
}

function Score({ score }: { score: number }) {
  return <div className="score"><strong>{score.toFixed(0)}</strong><span>AI score</span></div>;
}

function Callout({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return <section className="callout"><div><h2>{title}</h2><p>{text}</p></div>{action}</section>;
}

function Empty({ title, text }: { title: string; text: string }) {
  return <div className="empty"><strong>{title}</strong><p>{text}</p></div>;
}

function NumberInput({ label, value, onChange, step = 1 }: { label: string; value: number; step?: number; onChange: (value: number) => void }) {
  return <label className="field"><span>{label}</span><input type="number" step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}
