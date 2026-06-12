import type { ApiKeys, MarketQuote, NewsItem } from '../types';

const fmp = 'https://financialmodelingprep.com/api/v3';
const finnhub = 'https://finnhub.io/api/v1';
const alpha = 'https://www.alphavantage.co/query';

async function json<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Provider request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export async function scanPennyStocks(keys: ApiKeys, maxPrice: number, minVolume: number): Promise<MarketQuote[]> {
  if (!keys.fmp) {
    throw new Error('FMP API key is required for full U.S. penny stock discovery. Add it on the setup or settings screen.');
  }

  const url = `${fmp}/stock-screener?priceMoreThan=0.05&priceLowerThan=${maxPrice}&volumeMoreThan=${minVolume}&isActivelyTrading=true&limit=80&apikey=${keys.fmp}`;
  const rows = await json<Array<Record<string, unknown>>>(url);
  return rows
    .filter((row) => Number(row.price) > 0 && Number(row.price) <= maxPrice)
    .map((row) => ({
      symbol: String(row.symbol),
      name: String(row.companyName || row.symbol),
      price: Number(row.price || 0),
      changePercent: Number(row.changesPercentage || row.changePercentage || 0),
      volume: Number(row.volume || 0),
      avgVolume: Number(row.avgVolume || row.volume || 0),
      marketCap: Number(row.marketCap || 0),
      provider: 'FMP' as const,
      fetchedAt: new Date().toISOString()
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 40);
}

export async function getQuotes(symbols: string[], keys: ApiKeys): Promise<MarketQuote[]> {
  const clean = symbols.map((s) => s.trim().toUpperCase()).filter(Boolean);
  if (!clean.length) return [];

  if (keys.fmp) {
    const rows = await json<Array<Record<string, unknown>>>(`${fmp}/quote/${clean.join(',')}?apikey=${keys.fmp}`);
    return rows.map((row) => ({
      symbol: String(row.symbol),
      name: String(row.name || row.symbol),
      price: Number(row.price || 0),
      changePercent: Number(row.changesPercentage || 0),
      volume: Number(row.volume || 0),
      avgVolume: Number(row.avgVolume || row.volume || 0),
      marketCap: Number(row.marketCap || 0),
      provider: 'FMP' as const,
      fetchedAt: new Date().toISOString()
    }));
  }

  if (keys.finnhub) {
    const quotes = await Promise.all(clean.map(async (symbol) => {
      const row = await json<Record<string, number>>(`${finnhub}/quote?symbol=${symbol}&token=${keys.finnhub}`);
      return {
        symbol,
        price: Number(row.c || 0),
        changePercent: Number(row.dp || 0),
        volume: 0,
        provider: 'Finnhub' as const,
        fetchedAt: new Date().toISOString()
      };
    }));
    return quotes;
  }

  if (keys.alphaVantage) {
    const quotes = await Promise.all(clean.map(async (symbol) => {
      const row = await json<Record<string, Record<string, string>>>(`${alpha}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${keys.alphaVantage}`);
      const quote = row['Global Quote'] || {};
      return {
        symbol,
        price: Number(quote['05. price'] || 0),
        changePercent: Number(String(quote['10. change percent'] || '0').replace('%', '')),
        volume: Number(quote['06. volume'] || 0),
        provider: 'Alpha Vantage' as const,
        fetchedAt: new Date().toISOString()
      };
    }));
    return quotes;
  }

  throw new Error('No market data API keys configured.');
}

export async function getMarketNews(keys: ApiKeys, symbols: string[]): Promise<NewsItem[]> {
  const tickers = symbols.slice(0, 8).join(',');
  if (keys.fmp) {
    const rows = await json<Array<Record<string, unknown>>>(`${fmp}/stock_news?tickers=${tickers}&limit=20&apikey=${keys.fmp}`);
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
    const rows = await Promise.all(symbols.slice(0, 5).map((symbol) => json<Array<Record<string, unknown>>>(`${finnhub}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${keys.finnhub}`)));
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

function inferSentiment(title: string): NewsItem['sentiment'] {
  const text = title.toLowerCase();
  if (/(surge|gain|beat|approval|contract|record|partnership)/.test(text)) return 'positive';
  if (/(drop|loss|probe|delist|offering|miss|bankrupt)/.test(text)) return 'negative';
  return 'neutral';
}
