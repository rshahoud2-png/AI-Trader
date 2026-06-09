import { fetchMarketCandles } from "./mockMarket";
import { round } from "./indicators";
import type { AccountMetrics, AccountState, Position, Settings, Trade } from "./types";

export async function computeMetrics(account: AccountState): Promise<AccountMetrics> {
  const openTrades = account.trades.filter((trade) => trade.status === "open" && trade.action !== "hold");
  const openPositions = await Promise.all(openTrades.map(toPosition));
  const closedPositions = account.trades.filter((trade) => trade.status === "closed");
  const openValue = openPositions.reduce((sum, position) => sum + position.marketValue, 0);
  const realizedPnl = closedPositions.reduce((sum, trade) => sum + (trade.realizedPnl ?? 0), 0);
  const unrealizedPnl = openPositions.reduce((sum, position) => sum + position.unrealizedPnl, 0);
  const equity = round(account.cash + openValue);
  const totalPnl = round(realizedPnl + unrealizedPnl);
  const dailyPnl = todayTrades(account.trades).reduce((sum, trade) => sum + (trade.realizedPnl ?? 0), 0) + unrealizedPnl;
  const winCount = closedPositions.filter((trade) => (trade.realizedPnl ?? 0) > 0).length;
  const winRate = closedPositions.length > 0 ? round((winCount / closedPositions.length) * 100) : 0;
  const tradingHalted = dailyPnl <= -(account.settings.startingBalance * account.settings.maxDailyLossPercent) / 100;

  return {
    startingBalance: account.settings.startingBalance,
    cash: round(account.cash),
    equity,
    totalPnl,
    totalPnlPercent: round((totalPnl / account.settings.startingBalance) * 100),
    dailyPnl: round(dailyPnl),
    dailyPnlPercent: round((dailyPnl / account.settings.startingBalance) * 100),
    dailyGoalProgress: round((dailyPnl / ((account.settings.startingBalance * account.settings.dailyTargetPercent) / 100)) * 100),
    winRate,
    openPositions,
    closedPositions,
    recentTrades: [...account.trades].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 8),
    tradingHalted,
    warnings: settingsWarnings(account.settings, tradingHalted)
  };
}

export function canPlaceSimulatedTrade(account: AccountState, idea: Trade, metrics: AccountMetrics) {
  if (idea.action === "hold") return { ok: false, reason: "The research agent selected hold/watch only." };
  if (metrics.tradingHalted) return { ok: false, reason: "Paper trading is halted because max daily loss was reached." };
  const notional = idea.quantity * idea.entryPrice;
  if (notional > account.cash * 0.35) return { ok: false, reason: "Trade would exceed the engine's never-go-all-in cap." };
  return { ok: true, reason: "Simulation accepted." };
}

export async function applySimulatedTrade(account: AccountState, idea: Trade): Promise<AccountState> {
  const metrics = await computeMetrics(account);
  const gate = canPlaceSimulatedTrade(account, idea, metrics);
  if (!gate.ok) return account;

  const notional = round(idea.quantity * idea.entryPrice);
  return {
    ...account,
    cash: round(account.cash - notional),
    trades: [{ ...idea, id: `${idea.symbol}-${Date.now()}`, timestamp: new Date().toISOString(), status: "open" }, ...account.trades]
  };
}

async function toPosition(trade: Trade): Promise<Position> {
  const candles = await fetchMarketCandles(trade.symbol);
  const currentPrice = candles.at(-1)?.close ?? trade.entryPrice;
  const marketValue = round(trade.quantity * currentPrice);
  const direction = trade.action === "sell" ? -1 : 1;
  const unrealizedPnl = round((currentPrice - trade.entryPrice) * trade.quantity * direction);

  return {
    symbol: trade.symbol,
    assetType: trade.assetType,
    quantity: trade.quantity,
    entryPrice: trade.entryPrice,
    currentPrice,
    marketValue,
    unrealizedPnl,
    stopLoss: trade.stopLoss,
    takeProfit: trade.takeProfit,
    openedAt: trade.timestamp
  };
}

function todayTrades(trades: Trade[]) {
  const today = new Date().toISOString().slice(0, 10);
  return trades.filter((trade) => trade.timestamp.slice(0, 10) === today);
}

function settingsWarnings(settings: Settings, tradingHalted: boolean) {
  const warnings = [
    "Paper Trading Only: this app uses fake money, simulated fills, and mock data by default.",
    "The 20% daily goal is unrealistic for most market conditions and is not guaranteed.",
    "This dashboard is for education and research only. It does not provide financial advice."
  ];

  if (settings.riskPerTradePercent > 3) warnings.push("Risk per trade is above 3%, which is aggressive for a learning simulator.");
  if (settings.maxDailyLossPercent > 8) warnings.push("Max daily loss is high; the simulator may allow large drawdowns.");
  if (settings.dailyTargetPercent >= 20) warnings.push("Daily target is a stretch target only, not an expectation.");
  if (tradingHalted) warnings.push("Paper trading is halted for today because the max daily loss setting was reached.");
  return warnings;
}
