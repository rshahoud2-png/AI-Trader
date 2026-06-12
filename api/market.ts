import type { VercelRequest, VercelResponse } from '@vercel/node';

const fmp = 'https://financialmodelingprep.com/api/v3';
const finnhub = 'https://finnhub.io/api/v1';
const alpha = 'https://www.alphavantage.co/query';

type ProviderName = 'FMP' | 'Finnhub' | 'Alpha Vantage';

interface MarketQuote {
  symbol: string;
  name?: string;
  price: number;
  changePercent: number;
  volume: number;
  avgVolume?: number;
  marketCap?: number;
  provider: ProviderName;
  fetchedAt: string;
}

async function providerJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Provider request failed with HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

function apiKeys() {
  return {
    fmp: process.env.VITE_FMP_API_KEY || '',
    finnhub: process.env.VITE_FINNHUB_API_KEY || '',
    alphaVantage: process.env.VITE_ALPHA_VANTAGE_API_KEY || ''
  };
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    const type = String(request.query.type || 'quotes');
    const keys = apiKeys();
    const symbols = String(request.query.symbols || 'SNDL,BITF,OPEN,PSNY,SOFI,DNA')
      .split(',')
      .map((symbol) => symbol.trim().toUpperCase())
      .filter(Boolean);

    if (type === 'status') {
      response.status(200).json({ providers: { fmp: Boolean(keys.fmp), finnhub: Boolean(keys.finnhub), alphaVantage: Boolean(keys.alphaVantage) } });
      return;
    }

    if (type === 'scanner') {
      if (!keys.fmp) throw new Error('VITE_FMP_API_KEY is required for the penny stock scanner. Add it in Vercel Environment Variables and redeploy.');
      const maxPrice = Number(request.query.maxPrice || 5);
      const minVolume = Number(request.query.minVolume || 500000);
      const rows = await providerJson<Array<Record<string, unknown>>>(`${fmp}/stock-screener?priceMoreThan=0.05&priceLowerThan=${maxPrice}&volumeMoreThan=${minVolume}&isActivelyTrading=true&limit=80&apikey=${keys.fmp}`);
      response.status(200).json({ rows: rows.map(mapFmpScreener).filter((row) => row.price > 0 && row.price <= maxPrice).slice(0, 40) });
      return;
    }

    if (type === 'news') {
      const rows = await getNews(keys, symbols);
      response.status(200).json({ rows });
      return;
    }

    const rows = await getQuotes(keys, symbols);
    response.status(200).json({ rows });
  } catch (error) {
    response.status(200).json({
      rows: [],
      error: error instanceof Error ? error.message : 'Unable to load real market data.'
    });
  }
}

async function getQuotes(keys: ReturnType<typeof apiKeys>, symbols: string[]): Promise<MarketQuote[]> {
  if (keys.fmp) {
    const rows = await providerJson<Array<Record<string, unknown>>>(`${fmp}/quote/${symbols.join(',')}?apikey=${keys.fmp}`);
    return rows.map(mapFmpQuote);
  }

  if (keys.finnhub) {
    return Promise.all(symbols.map(async (symbol) => {
      const row = await providerJson<Record<string, number>>(`${finnhub}/quote?symbol=${symbol}&token=${keys.finnhub}`);
      return { symbol, price: Number(row.c || 0), changePercent: Number(row.dp || 0), volume: 0, provider: 'Finnhub' as const, fetchedAt: new Date().toISOString() };
    }));
  }

  if (keys.alphaVantage) {
    return Promise.all(symbols.map(async (symbol) => {
      const row = await providerJson<Record<string, Record<string, string>>>(`${alpha}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${keys.alphaVantage}`);
      const quote = row['Global Quote'] || {};
      return { symbol, price: Number(quote['05. price'] || 0), changePercent: Number(String(quote['10. change percent'] || '0').replace('%', '')), volume: Number(quote['06. volume'] || 0), provider: 'Alpha Vantage' as const, fetchedAt: new Date().toISOString() };
    }));
  }

  throw new Error('No market data provider keys are configured. Confirm VITE_FMP_API_KEY in Vercel.');
}

async function getNews(keys: ReturnType<typeof apiKeys>, symbols: string[]) {
  if (keys.fmp) {
    const rows = await providerJson<Array<Record<string, unknown>>>(`${fmp}/stock_news?tickers=${symbols.slice(0, 8).join(',')}&limit=20&apikey=${keys.fmp}`);
    return rows.map((row) => ({
      symbol: String(row.symbol || ''),
      title: String(row.title || 'Untitled market item'),
      source: String(row.site || 'FMP'),
      url: String(row.url || '#'),
      publishedAt: String(row.publishedDate || new Date().toISOString()),
      sentiment: inferSentiment(String(row.title || ''))
    }));
  }

  if (keys.finnhub) {
    const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const to = new Date().toISOString().slice(0, 10);
    const rows = await Promise.all(symbols.slice(0, 5).map((symbol) => providerJson<Array<Record<string, unknown>>>(`${finnhub}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${keys.finnhub}`)));
    return rows.flat().slice(0, 20).map((row) => ({
      symbol: String(row.related || ''),
      title: String(row.headline || 'Untitled market item'),
      source: String(row.source || 'Finnhub'),
      url: String(row.url || '#'),
      publishedAt: new Date(Number(row.datetime || Date.now() / 1000) * 1000).toISOString(),
      sentiment: inferSentiment(String(row.headline || ''))
    }));
  }

  return [];
}

function mapFmpQuote(row: Record<string, unknown>): MarketQuote {
  return {
    symbol: String(row.symbol),
    name: String(row.name || row.symbol),
    price: Number(row.price || 0),
    changePercent: Number(row.changesPercentage || 0),
    volume: Number(row.volume || 0),
    avgVolume: Number(row.avgVolume || row.volume || 0),
    marketCap: Number(row.marketCap || 0),
    provider: 'FMP',
    fetchedAt: new Date().toISOString()
  };
}

function mapFmpScreener(row: Record<string, unknown>): MarketQuote {
  return {
    symbol: String(row.symbol),
    name: String(row.companyName || row.symbol),
    price: Number(row.price || 0),
    changePercent: Number(row.changesPercentage || row.changePercentage || 0),
    volume: Number(row.volume || 0),
    avgVolume: Number(row.avgVolume || row.volume || 0),
    marketCap: Number(row.marketCap || 0),
    provider: 'FMP',
    fetchedAt: new Date().toISOString()
  };
}

function inferSentiment(title: string) {
  const text = title.toLowerCase();
  if (/(surge|gain|beat|approval|contract|record|partnership)/.test(text)) return 'positive';
  if (/(drop|loss|probe|delist|offering|miss|bankrupt)/.test(text)) return 'negative';
  return 'neutral';
}
