export type TradeAction = "buy" | "sell" | "hold";
export type TradeStatus = "open" | "closed" | "watching";

export type Trade = {
  id: string;
  symbol: string;
  assetType: "stock" | "crypto";
  action: TradeAction;
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit: number;
  reason: string;
  confidence: number;
  timestamp: string;
  status: TradeStatus;
  realizedPnl?: number;
};

export type Position = {
  symbol: string;
  assetType: "stock" | "crypto";
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  stopLoss: number;
  takeProfit: number;
  openedAt: string;
};

export type Settings = {
  startingBalance: number;
  dailyTargetPercent: number;
  riskPerTradePercent: number;
  maxDailyLossPercent: number;
  watchlist: string[];
};

export type AccountState = {
  cash: number;
  settings: Settings;
  trades: Trade[];
  lastStudyAt?: string;
};

export type MarketCandle = {
  date: string;
  close: number;
  volume: number;
};

export type SymbolAnalysis = {
  symbol: string;
  assetType: "stock" | "crypto";
  currentPrice: number;
  trend: "bullish" | "bearish" | "neutral";
  volumeSignal: string;
  movingAverages: {
    ma5: number;
    ma20: number;
  };
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  sentiment: "positive" | "neutral" | "negative";
  riskReward: number;
  idea: Trade;
  notes: string;
};

export type AccountMetrics = {
  startingBalance: number;
  cash: number;
  equity: number;
  totalPnl: number;
  totalPnlPercent: number;
  dailyPnl: number;
  dailyPnlPercent: number;
  dailyGoalProgress: number;
  winRate: number;
  openPositions: Position[];
  closedPositions: Trade[];
  recentTrades: Trade[];
  tradingHalted: boolean;
  warnings: string[];
};
