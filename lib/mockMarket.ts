import type { MarketCandle } from "./types";

const cryptoTickerMap: Record<string, string> = {
  BTC: "X:BTCUSD",
  ETH: "X:ETHUSD",
  SOL: "X:SOLUSD",
  DOGE: "X:DOGEUSD"
};

export function getMockCandles(symbol: string): MarketCandle[] {
  throw new Error(
    `Mock data is disabled. ${symbol.toUpperCase()} requires Polygon market data. Add POLYGON_API_KEY in Vercel and use a real-time Polygon plan for live stocks.`
  );
}

export function inferAssetType(symbol: string): "stock" | "crypto" {
  return Object.keys(cryptoTickerMap).includes(symbol.toUpperCase()) ? "crypto" : "stock";
}

export async function fetchMarketCandles(symbol: string): Promise<MarketCandle[]> {
  const key = process.env.POLYGON_API_KEY;
  if (!key) {
    throw new Error("Missing POLYGON_API_KEY. Add it in Vercel Project Settings > Environment Variables, then redeploy.");
  }

  const normalized = symbol.trim().toUpperCase();
  const assetType = inferAssetType(normalized);
  const polygonTicker = cryptoTickerMap[normalized] ?? normalized;
  const attempts: AggregateAttempt[] = [
    { multiplier: 1, timespan: "minute", daysBack: assetType === "crypto" ? 2 : 10, limit: 5000 },
    { multiplier: 5, timespan: "minute", daysBack: assetType === "crypto" ? 7 : 30, limit: 5000 },
    { multiplier: 1, timespan: "day", daysBack: 180, limit: 500 }
  ];

  const errors: string[] = [];

  for (const attempt of attempts) {
    try {
      const candles = await fetchPolygonAggregates(polygonTicker, attempt, key);
      if (candles.length > 0) {
        enforceFreshness(normalized, assetType, candles, attempt.timespan);
        return candles;
      }
      errors.push(`${attempt.multiplier}-${attempt.timespan}: empty results`);
    } catch (error) {
      errors.push(`${attempt.multiplier}-${attempt.timespan}: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  throw new Error(
    `Polygon returned no usable data for ${normalized}. Confirm the ticker is supported and your Polygon key has market-data access. Attempts: ${errors.join("; ")}`
  );
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

type AggregateAttempt = {
  multiplier: number;
  timespan: "minute" | "day";
  daysBack: number;
  limit: number;
};

async function fetchPolygonAggregates(ticker: string, attempt: AggregateAttempt, key: string): Promise<MarketCandle[]> {
  const from = formatDate(daysAgo(attempt.daysBack));
  const to = formatDate(new Date());
  const url = new URL(
    `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/${attempt.multiplier}/${attempt.timespan}/${from}/${to}`
  );

  url.searchParams.set("adjusted", "true");
  url.searchParams.set("sort", "asc");
  url.searchParams.set("limit", String(attempt.limit));
  url.searchParams.set("apiKey", key);

  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json()) as PolygonAggregateResponse;

  if (!response.ok || payload.status === "ERROR") {
    throw new Error(payload.error ?? payload.message ?? `HTTP ${response.status}`);
  }

  return (payload.results ?? []).map((bar) => ({
    date: new Date(bar.t).toISOString(),
    close: bar.c,
    volume: bar.v
  }));
}

function enforceFreshness(symbol: string, assetType: "stock" | "crypto", candles: MarketCandle[], timespan: "minute" | "day") {
  const newest = candles.at(-1);
  if (!newest) throw new Error(`No Polygon candles returned for ${symbol}.`);

  if (timespan === "day") return;

  const strict = process.env.LIVE_DATA_STRICT === "true";
  if (!strict && assetType === "stock" && !isUsMarketOpenNow()) return;

  const maxAgeMinutes = Number(process.env.LIVE_DATA_MAX_AGE_MINUTES ?? 15);
  const ageMinutes = (Date.now() - new Date(newest.date).getTime()) / 60000;

  if (ageMinutes > maxAgeMinutes) {
    throw new Error(
      `${symbol} latest Polygon bar is ${Math.round(ageMinutes)} minutes old. Check real-time plan access, market hours, or raise LIVE_DATA_MAX_AGE_MINUTES.`
    );
  }
}

function isUsMarketOpenNow() {
  const now = new Date();
  const eastern = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(now);

  const part = (type: string) => eastern.find((item) => item.type === type)?.value ?? "";
  const weekday = part("weekday");
  if (["Sat", "Sun"].includes(weekday)) return false;

  const hour = Number(part("hour"));
  const minute = Number(part("minute"));
  const minutes = hour * 60 + minute;
  return minutes >= 9 * 60 + 30 && minutes <= 16 * 60;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
