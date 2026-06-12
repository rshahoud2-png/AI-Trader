export type ProviderName = 'FMP' | 'Finnhub' | 'Alpha Vantage';

export interface ApiKeys {
  fmp?: string;
  finnhub?: string;
  alphaVantage?: string;
}

export interface RiskSettings {
  scannerMaxPrice: number;
  minVolume: number;
  startingCash: number;
  riskPerTrade: number;
  maxPositionPct: number;
}

export interface MarketQuote {
  symbol: string;
  name?: string;
  price: number;
  changePercent: number;
  volume: number;
  avgVolume?: number;
  marketCap?: number;
  provider: ProviderName;
  fetchedAt: string;
}

export interface NewsItem {
  symbol?: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface TechnicalSnapshot {
  rsi: number;
  sma5: number;
  sma20: number;
  momentum: number;
  relativeVolume: number;
}

export interface AiRecommendation {
  symbol: string;
  name?: string;
  score: number;
  confidence: number;
  action: 'Watch' | 'Paper Buy Candidate' | 'Avoid';
  thesis: string;
  riskNotes: string;
  quote: MarketQuote;
  technicals: TechnicalSnapshot;
  news: NewsItem[];
}

export interface PaperPosition {
  symbol: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
}

export interface PaperTrade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  confidence?: number;
  rationale?: string;
  tradedAt: string;
}

export interface PaperAccount {
  cash: number;
  positions: PaperPosition[];
  trades: PaperTrade[];
}
