import { fetchMarketCandles, inferAssetType } from "./mockMarket";
import { macd, movingAverage, round, rsi } from "./indicators";
import type { Settings, SymbolAnalysis, Trade } from "./types";

const sentimentBySymbol: Record<string, SymbolAnalysis["sentiment"]> = {
  AAPL: "neutral",
  MSFT: "positive",
  NVDA: "positive",
  TSLA: "neutral",
  BTC: "positive",
  ETH: "neutral"
};

export async function analyzeSymbol(symbol: string, settings: Settings): Promise<SymbolAnalysis> {
  const normalized = symbol.trim().toUpperCase();
  const candles = await fetchMarketCandles(normalized);
  const currentPrice = candles.at(-1)?.close ?? 0;
  const priorPrice = candles.at(-6)?.close ?? currentPrice;
  const ma5 = movingAverage(candles, 5);
  const ma20 = movingAverage(candles, 20);
  const currentRsi = rsi(candles);
  const currentMacd = macd(candles);
  const recentVolume = candles.at(-1)?.volume ?? 0;
  const averageVolume = candles.slice(-20).reduce((sum, candle) => sum + candle.volume, 0) / 20;
  const sentiment = sentimentBySymbol[normalized] ?? "neutral";

  const trend =
    currentPrice > ma20 && ma5 > ma20
      ? "bullish"
      : currentPrice < ma20 && ma5 < ma20
        ? "bearish"
        : "neutral";

  const volumeSignal = recentVolume > averageVolume * 1.08 ? "Above-average participation" : "Normal participation";
  const action = pickAction(trend, currentRsi, currentMacd.histogram, sentiment);
  const stopLoss = round(action === "buy" ? currentPrice * 0.97 : currentPrice * 1.03);
  const takeProfit = round(action === "buy" ? currentPrice * 1.06 : currentPrice * 0.94);
  const risk = Math.abs(currentPrice - stopLoss);
  const reward = Math.abs(takeProfit - currentPrice);
  const riskReward = risk === 0 ? 0 : round(reward / risk);
  const confidence = confidenceScore(trend, currentRsi, currentMacd.histogram, sentiment, riskReward);

  const idea: Trade = {
    id: `${normalized}-${Date.now()}`,
    symbol: normalized,
    assetType: inferAssetType(normalized),
    action,
    quantity: action === "hold" ? 0 : simulatedQuantity(settings.startingBalance, settings.riskPerTradePercent, currentPrice, stopLoss),
    entryPrice: currentPrice,
    stopLoss,
    takeProfit,
    reason: buildReason(trend, currentRsi, currentMacd.histogram, sentiment, volumeSignal),
    confidence,
    timestamp: new Date().toISOString(),
    status: action === "hold" ? "watching" : "open"
  };

  return {
    symbol: normalized,
    assetType: inferAssetType(normalized),
    currentPrice,
    trend,
    volumeSignal,
    movingAverages: { ma5, ma20 },
    rsi: currentRsi,
    macd: currentMacd,
    sentiment,
    riskReward,
    idea,
    notes: `${normalized} shows a ${trend} trend with RSI at ${currentRsi}. This simulated idea is for research only and cannot guarantee profit.`
  };
}

export async function runDailyResearch(settings: Settings) {
  const analyses = await Promise.all(settings.watchlist.map((symbol) => analyzeSymbol(symbol, settings)));
  const strongest = [...analyses].sort((a, b) => b.idea.confidence - a.idea.confidence)[0];

  return {
    generatedAt: new Date().toISOString(),
    headline: "Daily Market Study",
    summary:
      "The agent reviewed mock price action, volume, moving averages, RSI, MACD, placeholder sentiment, and risk/reward. Ideas are simulated only and are not financial advice.",
    keyTakeaways: [
      "The 20% daily target is intentionally shown as a stretch target, not an expected return.",
      "Position sizing is constrained by risk-per-trade settings and never uses the full account.",
      "Trading is halted for the day when the configured paper max daily loss is reached."
    ],
    strongestIdea: strongest,
    analyses
  };
}

function pickAction(
  trend: SymbolAnalysis["trend"],
  currentRsi: number,
  histogram: number,
  sentiment: SymbolAnalysis["sentiment"]
): "buy" | "sell" | "hold" {
  if (trend === "bullish" && currentRsi < 72 && histogram > 0 && sentiment !== "negative") return "buy";
  if (trend === "bearish" && currentRsi > 35 && histogram < 0) return "sell";
  return "hold";
}

function confidenceScore(
  trend: SymbolAnalysis["trend"],
  currentRsi: number,
  histogram: number,
  sentiment: SymbolAnalysis["sentiment"],
  riskReward: number
): number {
  let score = 45;
  if (trend !== "neutral") score += 12;
  if (currentRsi > 45 && currentRsi < 68) score += 10;
  if (Math.abs(histogram) > 0.1) score += 8;
  if (sentiment === "positive") score += 8;
  if (riskReward >= 1.5) score += 10;
  return Math.min(88, score);
}

function simulatedQuantity(balance: number, riskPercent: number, entryPrice: number, stopLoss: number): number {
  const maxRiskDollars = balance * (riskPercent / 100);
  const perUnitRisk = Math.max(0.01, Math.abs(entryPrice - stopLoss));
  const riskSizedQuantity = maxRiskDollars / perUnitRisk;
  const maxCapitalQuantity = (balance * 0.25) / entryPrice;
  return round(Math.max(0, Math.min(riskSizedQuantity, maxCapitalQuantity)), 4);
}

function buildReason(
  trend: SymbolAnalysis["trend"],
  currentRsi: number,
  histogram: number,
  sentiment: SymbolAnalysis["sentiment"],
  volumeSignal: string
) {
  return `Trend is ${trend}, RSI is ${currentRsi}, MACD histogram is ${round(histogram)}, sentiment placeholder is ${sentiment}, and volume shows ${volumeSignal.toLowerCase()}.`;
}
