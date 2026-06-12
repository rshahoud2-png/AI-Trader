import type { MarketQuote, PaperAccount, PaperTrade } from '../types';

const accountKey = 'ai-penny-terminal-account';

export function loadAccount(startingCash: number): PaperAccount {
  const raw = localStorage.getItem(accountKey);
  if (!raw) return { cash: startingCash, positions: [], trades: [] };
  try {
    return JSON.parse(raw) as PaperAccount;
  } catch {
    return { cash: startingCash, positions: [], trades: [] };
  }
}

export function saveAccount(account: PaperAccount) {
  localStorage.setItem(accountKey, JSON.stringify(account));
}

export function markToMarket(account: PaperAccount, quotes: MarketQuote[]): PaperAccount {
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
  return {
    ...account,
    positions: account.positions.map((position) => {
      const quote = bySymbol.get(position.symbol);
      return quote ? { ...position, lastPrice: quote.price } : position;
    })
  };
}

export function accountEquity(account: PaperAccount) {
  return account.cash + account.positions.reduce((sum, position) => sum + position.quantity * position.lastPrice, 0);
}

export function unrealizedPl(account: PaperAccount) {
  return account.positions.reduce((sum, position) => sum + (position.lastPrice - position.averagePrice) * position.quantity, 0);
}

export function realizedPl(account: PaperAccount) {
  return account.trades.reduce((sum, trade) => sum + (trade.side === 'SELL' ? (trade.price * trade.quantity) : 0), 0) -
    account.trades.reduce((sum, trade) => sum + (trade.side === 'BUY' ? (trade.price * trade.quantity) : 0), 0) +
    account.positions.reduce((sum, position) => sum + position.averagePrice * position.quantity, 0);
}

export function buy(account: PaperAccount, quote: MarketQuote, dollars: number, confidence?: number, rationale?: string): PaperAccount {
  if (quote.price <= 0) throw new Error('Cannot buy without a valid real quote.');
  const spend = Math.min(dollars, account.cash);
  if (spend < quote.price) throw new Error('Not enough paper cash for this order.');
  const quantity = Number((spend / quote.price).toFixed(6));
  const existing = account.positions.find((position) => position.symbol === quote.symbol);
  const positions = existing
    ? account.positions.map((position) => position.symbol === quote.symbol
      ? {
          ...position,
          quantity: position.quantity + quantity,
          averagePrice: ((position.averagePrice * position.quantity) + spend) / (position.quantity + quantity),
          lastPrice: quote.price
        }
      : position)
    : [...account.positions, { symbol: quote.symbol, quantity, averagePrice: quote.price, lastPrice: quote.price }];

  return recordTrade({ ...account, cash: account.cash - spend, positions }, quote.symbol, 'BUY', quantity, quote.price, confidence, rationale);
}

export function sell(account: PaperAccount, quote: MarketQuote, quantity: number, confidence?: number, rationale?: string): PaperAccount {
  const existing = account.positions.find((position) => position.symbol === quote.symbol);
  if (!existing) throw new Error('No open paper position for this symbol.');
  const sellQty = Math.min(quantity, existing.quantity);
  const proceeds = sellQty * quote.price;
  const remaining = existing.quantity - sellQty;
  const positions = remaining > 0
    ? account.positions.map((position) => position.symbol === quote.symbol ? { ...position, quantity: remaining, lastPrice: quote.price } : position)
    : account.positions.filter((position) => position.symbol !== quote.symbol);
  return recordTrade({ ...account, cash: account.cash + proceeds, positions }, quote.symbol, 'SELL', sellQty, quote.price, confidence, rationale);
}

function recordTrade(account: PaperAccount, symbol: string, side: 'BUY' | 'SELL', quantity: number, price: number, confidence?: number, rationale?: string): PaperAccount {
  const trade: PaperTrade = {
    id: crypto.randomUUID(),
    symbol,
    side,
    quantity,
    price,
    confidence,
    rationale,
    tradedAt: new Date().toISOString()
  };
  const updated = { ...account, trades: [trade, ...account.trades].slice(0, 200) };
  saveAccount(updated);
  return updated;
}
