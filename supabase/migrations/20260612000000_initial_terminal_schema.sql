create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.paper_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  starting_cash numeric(14,2) not null default 1000,
  cash_balance numeric(14,2) not null default 1000,
  equity_value numeric(14,2) not null default 1000,
  max_risk_per_trade numeric(6,4) not null default 0.02,
  max_daily_loss numeric(14,2) not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  symbol text not null,
  notes text,
  alert_below numeric(14,4),
  alert_above numeric(14,4),
  created_at timestamptz not null default now(),
  unique(profile_id, symbol)
);

create table if not exists public.paper_positions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.paper_accounts(id) on delete cascade,
  symbol text not null,
  quantity numeric(18,6) not null,
  average_price numeric(14,4) not null,
  last_price numeric(14,4),
  market_value numeric(14,2),
  unrealized_pl numeric(14,2),
  opened_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(account_id, symbol)
);

create table if not exists public.paper_trades (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.paper_accounts(id) on delete cascade,
  symbol text not null,
  side text not null check (side in ('BUY','SELL')),
  quantity numeric(18,6) not null,
  price numeric(14,4) not null,
  fees numeric(14,4) not null default 0,
  realized_pl numeric(14,2),
  confidence_score numeric(5,2),
  rationale text,
  traded_at timestamptz not null default now()
);

create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  symbol text not null,
  score numeric(6,2) not null,
  confidence numeric(5,2) not null,
  thesis text not null,
  risk_notes text,
  provider_payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_market_reports (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  report_date date not null default current_date,
  summary text not null,
  top_symbols jsonb not null default '[]'::jsonb,
  risk_level text not null default 'moderate',
  created_at timestamptz not null default now(),
  unique(profile_id, report_date)
);

create table if not exists public.market_data_cache (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  provider text not null,
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  unique(symbol, provider)
);

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  fmp_key_present boolean not null default false,
  finnhub_key_present boolean not null default false,
  alpha_vantage_key_present boolean not null default false,
  scanner_max_price numeric(10,2) not null default 5,
  min_volume bigint not null default 500000,
  risk_per_trade numeric(6,4) not null default 0.02,
  max_position_pct numeric(6,4) not null default 0.2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id)
);

alter table public.profiles enable row level security;
alter table public.paper_accounts enable row level security;
alter table public.watchlists enable row level security;
alter table public.paper_trades enable row level security;
alter table public.paper_positions enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.daily_market_reports enable row level security;
alter table public.market_data_cache enable row level security;
alter table public.app_settings enable row level security;

create index if not exists idx_market_data_cache_symbol_provider on public.market_data_cache(symbol, provider, expires_at);
create index if not exists idx_ai_recommendations_symbol_created on public.ai_recommendations(symbol, created_at desc);
create index if not exists idx_paper_trades_account_time on public.paper_trades(account_id, traded_at desc);
