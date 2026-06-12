import type { ApiKeys, MarketQuote, NewsItem } from '../types';

interface MarketResponse<T> {
  rows: T[];
  error?: string;
}

async function getRows<T>(url: string): Promise<T[]> {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Application API request failed with HTTP ${response.status}`);
  const payload = await response.json() as MarketResponse<T>;
  if (payload.error) throw new Error(payload.error);
  return payload.rows || [];
}

export async function scanPennyStocks(_keys: ApiKeys, maxPrice: number, minVolume: number): Promise<MarketQuote[]> {
  return getRows<MarketQuote>(`/api/market?type=scanner&maxPrice=${encodeURIComponent(maxPrice)}&minVolume=${encodeURIComponent(minVolume)}`);
}

export async function getQuotes(symbols: string[], _keys: ApiKeys): Promise<MarketQuote[]> {
  const clean = symbols.map((s) => s.trim().toUpperCase()).filter(Boolean);
  if (!clean.length) return [];
  return getRows<MarketQuote>(`/api/market?type=quotes&symbols=${encodeURIComponent(clean.join(','))}`);
}

export async function getMarketNews(_keys: ApiKeys, symbols: string[]): Promise<NewsItem[]> {
  const clean = symbols.map((s) => s.trim().toUpperCase()).filter(Boolean);
  if (!clean.length) return [];
  return getRows<NewsItem>(`/api/market?type=news&symbols=${encodeURIComponent(clean.join(','))}`);
}
