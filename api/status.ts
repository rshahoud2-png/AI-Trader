import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const requiredTables = [
  'profiles',
  'paper_accounts',
  'watchlists',
  'paper_trades',
  'paper_positions',
  'ai_recommendations',
  'daily_market_reports',
  'market_data_cache',
  'app_settings'
];

const fmp = 'https://financialmodelingprep.com/api/v3';
const finnhub = 'https://finnhub.io/api/v1';
const alpha = 'https://www.alphavantage.co/query';

type ProviderHealth = { configured: boolean; connected: boolean; message: string };

export default async function handler(_request: VercelRequest, response: VercelResponse) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const fmpKey = process.env.VITE_FMP_API_KEY || '';
  const finnhubKey = process.env.VITE_FINNHUB_API_KEY || '';
  const alphaKey = process.env.VITE_ALPHA_VANTAGE_API_KEY || '';

  const [fmpHealth, finnhubHealth, alphaHealth] = await Promise.all([
    checkProvider('FMP', Boolean(fmpKey), `${fmp}/quote/AAPL?apikey=${fmpKey}`),
    checkProvider('Finnhub', Boolean(finnhubKey), `${finnhub}/quote?symbol=AAPL&token=${finnhubKey}`),
    checkProvider('Alpha Vantage', Boolean(alphaKey), `${alpha}?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${alphaKey}`)
  ]);

  const tables: Record<string, { exists: boolean; message: string }> = {};
  let supabaseConnected = false;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    await Promise.all(requiredTables.map(async (table) => {
      const { error } = await supabase.from(table).select('*', { head: true, count: 'exact' }).limit(1);
      if (!error) {
        tables[table] = { exists: true, message: 'reachable' };
        supabaseConnected = true;
        return;
      }

      if (error.code === '42P01') {
        tables[table] = { exists: false, message: 'missing table' };
        return;
      }

      tables[table] = { exists: true, message: error.message || 'exists but access is restricted by RLS' };
      supabaseConnected = true;
    }));
  }

  response.status(200).json({
    supabase: {
      configured: Boolean(supabaseUrl && supabaseAnonKey),
      connected: supabaseConnected,
      tables
    },
    providers: {
      fmp: fmpHealth.connected,
      finnhub: finnhubHealth.connected,
      alphaVantage: alphaHealth.connected
    },
    providerHealth: {
      fmp: fmpHealth,
      finnhub: finnhubHealth,
      alphaVantage: alphaHealth
    },
    env: {
      VITE_SUPABASE_URL: Boolean(supabaseUrl),
      VITE_SUPABASE_ANON_KEY: Boolean(supabaseAnonKey),
      VITE_FMP_API_KEY: Boolean(fmpKey),
      VITE_FINNHUB_API_KEY: Boolean(finnhubKey),
      VITE_ALPHA_VANTAGE_API_KEY: Boolean(alphaKey)
    }
  });
}

async function checkProvider(name: string, configured: boolean, url: string): Promise<ProviderHealth> {
  if (!configured) return { configured: false, connected: false, message: `${name} key is not configured` };
  try {
    const response = await fetch(url, { headers: { accept: 'application/json' } });
    if (!response.ok) return { configured: true, connected: false, message: `${name} returned HTTP ${response.status}` };
    const payload = await response.json() as unknown;
    if (name === 'Alpha Vantage' && payload && typeof payload === 'object' && ('Error Message' in payload || 'Note' in payload)) {
      return { configured: true, connected: false, message: `${name} returned an API limit or key error` };
    }
    return { configured: true, connected: true, message: `${name} responded successfully` };
  } catch (error) {
    return { configured: true, connected: false, message: error instanceof Error ? error.message : `${name} request failed` };
  }
}
