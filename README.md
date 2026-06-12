# AI Penny Stock Research & Paper Trading Terminal

A production-oriented React + TypeScript + Vite terminal for researching U.S. penny stocks, ranking opportunities with an AI-style scoring engine, and paper trading with a $1,000 virtual account.

This application uses real market data providers only. If API keys are missing, the app shows a setup screen instead of fake market rows.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase PostgreSQL schema and client integration
- Financial Modeling Prep primary market data
- Finnhub and Alpha Vantage quote/news fallbacks
- Vercel deployment config
- Electron + electron-builder Windows packaging support
- GitHub Actions workflow for Windows installer builds

## Market Data

Primary provider:

```text
VITE_FMP_API_KEY=your_fmp_key
```

Fallback providers:

```text
VITE_FINNHUB_API_KEY=your_finnhub_key
VITE_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
```

FMP is required for full U.S. penny stock discovery because the scanner uses FMP's screener endpoint for stocks under the configured max price. Finnhub and Alpha Vantage are used for fallback quotes and news/watchlist coverage.

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor or Supabase CLI.
3. Run the migration in:

```text
supabase/migrations/20260612000000_initial_terminal_schema.sql
```

4. Add these Vercel environment variables:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The schema includes:

- profiles
- paper_accounts
- watchlists
- paper_trades
- paper_positions
- ai_recommendations
- daily_market_reports
- market_data_cache
- app_settings

## Vercel Deployment

1. Import this GitHub repository into Vercel.
2. Vercel should detect Vite automatically.
3. Confirm build settings:

```text
Build command: npm run build
Output directory: dist
```

4. Add the environment variables from `.env.example`.
5. Redeploy.

## Local Commands

You said you do not have a local development environment, but these commands are available for CI or future local work:

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

The workflow installs dependencies, builds the Vite app, runs electron-builder, and uploads the Windows installer artifact.

## Application Features

- Setup screen when API keys are missing
- Professional dark trading terminal layout
- Real-data watchlist quotes
- Real market news via provider APIs
- FMP penny stock scanner under the configured max price, default `$5`
- AI research rankings based on price action, volume, relative volume, technical indicators, and news sentiment
- Paper trading portfolio starting at `$1,000`
- Buy/sell paper trades using real quotes only
- Trade history and open-position tracking
- Settings for API keys and risk management

## Important Disclaimer

This application is for research and paper trading only. It is not financial advice, investment advice, a brokerage service, or a guarantee of returns. Penny stocks are high-risk and highly volatile.
