# AI Penny Stock Research & Paper Trading Terminal

A production-oriented React + TypeScript + Vite terminal for researching U.S. penny stocks, ranking opportunities with an AI-style scoring engine, and paper trading with a $1,000 virtual account.

The app uses real market data only. If provider data cannot load, the dashboard shows a setup/status panel and a clear provider error instead of fake market rows.

## Current Production Architecture

- Vite renders the terminal UI.
- Vercel serverless functions proxy provider calls through same-origin routes:
  - `/api/status`
  - `/api/market`
- Provider keys are read by Vercel functions from environment variables.
- FMP is required for the scanner. Finnhub and Alpha Vantage are fallbacks for quotes/news.
- Supabase table health is checked by `/api/status`.

## Required Vercel Environment Variables

Confirm these exact names in Vercel Project Settings > Environment Variables:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_FMP_API_KEY=your_fmp_key
```

Optional fallback providers:

```text
VITE_FINNHUB_API_KEY=your_finnhub_key
VITE_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
```

If `/api/status` reports `FMP returned HTTP 403`, the variable exists but the key is invalid, restricted, expired, or the FMP plan does not allow the requested endpoint. Replace the key or upgrade/enable the required FMP endpoints, then redeploy.

## Supabase SQL Setup

Run this file in Supabase SQL Editor:

```text
supabase/migrations/20260612000000_initial_terminal_schema.sql
```

It creates:

- profiles
- paper_accounts
- watchlists
- paper_trades
- paper_positions
- ai_recommendations
- daily_market_reports
- market_data_cache
- app_settings

Quick verification after deployment:

```text
https://your-vercel-domain.vercel.app/api/status
```

All required tables should show `exists: true` or `reachable`.

## Vercel Deployment

1. Import this repository into Vercel.
2. Framework preset: Vite.
3. Build command:

```text
npm run build
```

4. Output directory:

```text
dist
```

5. Add the environment variables above.
6. Redeploy after changing any provider key.

## Local Commands

These are for CI or future local work:

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Electron / Windows Installer

Electron support is included for future desktop packaging.

```bash
npm run dist:win
```

GitHub Actions workflow:

```text
.github/workflows/windows-installer.yml
```

## Features

- Deployment status page for Supabase and provider health
- Professional dark trading terminal UI
- Real provider-backed watchlist quotes
- Real market news through provider APIs
- FMP penny stock scanner under the configured max price, default `$5`
- AI rankings based on price action, volume, relative volume, technical indicators, and news sentiment
- Paper trading portfolio starting at `$1,000`
- Buy/sell paper trades using real quotes only
- Trade history and open-position tracking
- Risk and watchlist settings

## Important Disclaimer

This application is for research and paper trading only. It is not financial advice, investment advice, a brokerage service, or a guarantee of returns. Penny stocks are high-risk and highly volatile.
