import type { MarketCandle } from "./types";

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function movingAverage(candles: MarketCandle[], period: number): number {
  return round(average(candles.slice(-period).map((candle) => candle.close)));
}

export function rsi(candles: MarketCandle[], period = 14): number {
  const recent = candles.slice(-(period + 1));
  let gains = 0;
  let losses = 0;

  for (let index = 1; index < recent.length; index += 1) {
    const delta = recent[index].close - recent[index - 1].close;
    if (delta >= 0) gains += delta;
    else losses += Math.abs(delta);
  }

  if (losses === 0) return 100;
  const rs = gains / period / (losses / period);
  return round(100 - 100 / (1 + rs));
}

export function ema(values: number[], period: number): number[] {
  const multiplier = 2 / (period + 1);
  const result: number[] = [];
  values.forEach((value, index) => {
    if (index === 0) result.push(value);
    else result.push(value * multiplier + result[index - 1] * (1 - multiplier));
  });
  return result;
}

export function macd(candles: MarketCandle[]) {
  const closes = candles.map((candle) => candle.close);
  const fast = ema(closes, 12);
  const slow = ema(closes, 26);
  const macdLine = fast.map((value, index) => value - slow[index]);
  const signalLine = ema(macdLine, 9);
  const macdValue = macdLine.at(-1) ?? 0;
  const signal = signalLine.at(-1) ?? 0;

  return {
    macd: round(macdValue),
    signal: round(signal),
    histogram: round(macdValue - signal)
  };
}

export function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}
