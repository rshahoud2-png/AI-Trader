import type { MarketCandle } from "./types";

const baseSeries: Record<string, number[]> = {
  AAPL: [186, 187, 186.4, 188.2, 189.1, 190, 188.7, 191.5, 193.2, 192.6, 194, 195.4, 196.2, 195.6, 197.8, 198.1, 199.7, 201.3, 200.5, 202.8, 204.1, 205.3, 204.8, 206.9, 208.2, 207.4, 209.1, 210.5],
  MSFT: [420, 418, 421, 424, 426, 429, 431, 428, 430, 433, 436, 438, 437, 440, 444, 443, 446, 449, 451, 448, 452, 455, 457, 456, 459, 462, 461, 464],
  NVDA: [112, 114, 116, 115, 118, 121, 123, 122, 126, 129, 131, 130, 134, 137, 136, 139, 142, 144, 143, 147, 149, 151, 150, 154, 156, 155, 158, 161],
  TSLA: [178, 176, 174, 171, 173, 170, 168, 171, 175, 177, 174, 172, 176, 179, 181, 180, 184, 187, 185, 188, 191, 190, 193, 196, 194, 197, 201, 199],
  BTC: [64000, 64600, 63950, 65120, 66040, 65510, 66720, 67100, 66480, 67650, 68240, 68920, 68400, 69250, 70100, 69820, 70640, 71250, 72100, 71840, 72900, 73550, 73180, 74200, 75150, 74800, 75920, 76600],
  ETH: [3180, 3225, 3195, 3260, 3310, 3290, 3355, 3380, 3340, 3415, 3460, 3495, 3470, 3530, 3590, 3570, 3625, 3660, 3710, 3695, 3750, 3795, 3770, 3835, 3890, 3860, 3925, 3980]
};

export function getMockCandles(symbol: string): MarketCandle[] {
  const normalized = symbol.trim().toUpperCase();
  const fallback = baseSeries.AAPL;
  const prices = baseSeries[normalized] ?? fallback.map((price, index) => price * (0.92 + index * 0.003));
  const start = new Date();
  start.setDate(start.getDate() - prices.length + 1);

  return prices.map((close, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const volume = Math.round(900000 + Math.sin(index / 2) * 160000 + index * 28000 + normalized.length * 7100);
    return {
      date: date.toISOString().slice(0, 10),
      close,
      volume
    };
  });
}

export function inferAssetType(symbol: string): "stock" | "crypto" {
  return ["BTC", "ETH", "SOL", "DOGE"].includes(symbol.toUpperCase()) ? "crypto" : "stock";
}

export async function fetchMarketCandles(symbol: string): Promise<MarketCandle[]> {
  // Replace this with Alpha Vantage, Polygon.io, Yahoo Finance, CoinGecko, or Finnhub.
  // Keep all broker integrations out of this app; it is a simulation only.
  return getMockCandles(symbol);
}
