# Educational Paper-Trading AI Agent

A full-stack Next.js dashboard for an educational AI-style market research and paper-trading simulator.

## Safety First

This project uses fake money only.

- Starting balance: `$1,000` paper balance
- No real brokerage connections
- No real orders
- No financial advice
- Mock market data works immediately
- The `20%` daily target is displayed only as an unrealistic stretch target, not an expectation or guarantee

## Features

- Paper trading engine with cash, equity, open positions, closed positions, P/L, daily P/L, and win rate
- Simulated buy/sell/hold trade ideas for stocks and crypto
- Trade records include symbol, action, fake quantity, entry, exit, stop loss, take profit, reason, confidence, and timestamp
- AI-style daily market study using price trend, volume, moving averages, RSI, MACD, placeholder sentiment, and risk/reward
- Risk controls for max risk per trade, max daily loss, and daily target
- Stop-trading status when max daily paper loss is reached
- Dark professional fintech dashboard UI
- JSON-backed storage in `data/paper-account.json`
- API routes for account, research, and settings
- Ready for Vercel deployment

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- JSON storage
- API routes
- Lucide icons

## Getting Started

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Build for production:

```bash
npm run build
```

## Pages

- `/` - dashboard with fake balance, daily goal progress, P/L, open positions, and recent simulated trades
- `/research` - daily market notes, watchlist analysis, and generated paper trade ideas
- `/settings` - starting balance, daily target, risk per trade, max daily loss, and watchlist symbols

## API Routes

- `GET /api/account` returns account state and calculated metrics
- `GET /api/research` returns the daily market study
- `POST /api/research` runs the daily study and may add one simulated paper trade if risk rules allow it
- `GET /api/settings` returns current settings
- `PATCH /api/settings` updates simulator settings

## How The Fake Trading Engine Works

The simulator starts with a `$1,000` fake balance. It reads and writes account data from:

```text
data/paper-account.json
```

The engine:

- Tracks paper cash and simulated trades
- Values open positions using mock prices
- Calculates realized and unrealized P/L
- Calculates daily P/L and daily goal progress
- Calculates win rate from closed simulated trades
- Blocks simulated entries when the max daily loss threshold is reached
- Caps position sizing so the account never goes all-in

## AI Market Research Agent

The research agent lives in:

```text
lib/researchAgent.ts
```

It studies:

- Price trend
- Volume signal
- 5-period and 20-period moving averages
- RSI
- MACD
- Placeholder news sentiment
- Risk/reward

The generated idea is a research artifact for simulated paper trading only. It does not guarantee profit.

## Adding Real Market APIs Later

Mock data is in:

```text
lib/mockMarket.ts
```

Replace `fetchMarketCandles` with a provider such as:

- Alpha Vantage
- Polygon.io
- Yahoo Finance
- CoinGecko
- Finnhub

Use `.env.example` as the template for API keys. Keep real brokerage order placement out of this project unless you intentionally create a separate, regulated, production-grade system with appropriate compliance controls.

## Deploying To Vercel

1. Push the repository to GitHub.
2. Import the repository in Vercel.
3. Keep the default Next.js build settings.
4. Add optional API keys from `.env.example` if you later connect market data providers.
5. Deploy.

Note: JSON file storage is fine for local demos and educational use. For a multi-user deployed app, replace it with a hosted database such as Vercel Postgres, Turso, Supabase, or another managed database.

## Risk Disclaimer

This software is an educational simulation and research dashboard. It is not financial advice, investment advice, a brokerage service, or a guarantee of returns. The 20% daily target is unrealistic for most real-world trading conditions and must not be treated as expected performance. All trades are fake-money simulations.
