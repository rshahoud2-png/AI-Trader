import type { MarketCandle } from "./types";

const cryptoTickerMap: Record<string, string> = {
  BTC: "X:BTCUSD",
  ETH: "X:ETHUSD",
  SOL: "X:SOLUSD",
  DOGE: "X:DOGEUSD"
};

export function getMockCandles(symbol: string): MarketCandle[] {
  throw new Error(
    `Mock data is disabled. ${symbol.toUpperCase()} requires live Polygon market data. Add POLYGON_API_KEY in Vercel and use a real-time Polygon plan.`
  );
}

export function inferAssetType(symbol: string): "stock" | "crypto" {
  return Object.keys(cryptoTickerMap).includes(symbol.toUpperCase()) ? "crypto" : "stock";
}

export async function fetchMarketCandles(symbol: string): Promise<MarketCandle[]> {
  const key = process.env.POLYGON_API_KEY;
  if (!key) {
    throw new Error("Missing POLYGON_API_KEY. Add it in Vercel Project Settings > Environment Variables.");
  }

  const normalized = symbol.trim().toUpperCase();
  const polygonTicker = cryptoTickerMap[normalized] ?? normalized;
  const now = new Date();
  const from = formatDate(daysAgo(7));
  const to = formatDate(now);
  const url = new URL(
    `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(polygonTicker)}/range/1/minute/${from}/${to}`
  );

  url.searchParams.set("adjusted", "true");
  url.searchParams.set("sort", "asc");
  url.searchParams.set("limit", "5000");
  url.searchParams.set("apiKey", key);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Polygon market data request failed with HTTP ${response.status}. Check API key, ticker, and plan.`);
  }

  const payload = (await response.json()) as PolygonAggregateResponse;
  if (payload.status !== "OK" || !payload.results?.length) {
    throw new Error(payload.error ?? payload.message ?? `No live Polygon bars returned for ${normalized}.`);
  }

  const candles = payload.results.map((bar) => ({
    date: new Date(bar.t).toISOString(),
    close: bar.c,
    volume: bar.v
  }));

  enforceLiveFreshness(normalized, candles);
  return candles;
}

type PolygonAggregateResponse = {
  status?: string;
  message?: string;
  error?: string;
  results?: Array<{
    c: number;
    t: number;
    v: number;
  }>;
};

function enforceLiveFreshness(symbol: string, candles: MarketCandle[]) {
  const maxAgeMinutes = Number(process.env.LIVE_DATA_MAX_AGE_MINUTES ?? 5);
  const newest = candles.at(-1);
  if (!newest) throw new Error(`No live candles returned for ${symbol}.`);

  const ageMinutes = (Date.now() - new Date(newest.date).getTime()) / 60000;
  if (ageMinutes > maxAgeMinutes) {
    throw new Error(
      `${symbol} data is ${Math.round(ageMinutes)} minutes old. Live-data-only mode blocks stale, delayed, or closed-market data.`
    );
  }
}

function daysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
