import type { MarketQuote, TechnicalSnapshot } from '../types';

export function computeTechnicals(quote: MarketQuote): TechnicalSnapshot {
  const relativeVolume = quote.avgVolume && quote.avgVolume > 0 ? quote.volume / quote.avgVolume : 1;
  const momentum = quote.changePercent;
  const syntheticBase = Math.max(quote.price, 0.01);
  const sma5 = syntheticBase * (1 + quote.changePercent / 100 / 2);
  const sma20 = syntheticBase * (1 - quote.changePercent / 100 / 3);
  const rsi = clamp(50 + quote.changePercent * 3 + (relativeVolume - 1) * 8, 5, 95);
  return { rsi, sma5, sma20, momentum, relativeVolume };
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function currency(value: number) {
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

export function pct(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}
