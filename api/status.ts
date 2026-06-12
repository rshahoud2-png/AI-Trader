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

export default async function handler(_request: VercelRequest, response: VercelResponse) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const providers = {
    fmp: Boolean(process.env.VITE_FMP_API_KEY),
    finnhub: Boolean(process.env.VITE_FINNHUB_API_KEY),
    alphaVantage: Boolean(process.env.VITE_ALPHA_VANTAGE_API_KEY)
  };

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
    providers,
    env: {
      VITE_SUPABASE_URL: Boolean(supabaseUrl),
      VITE_SUPABASE_ANON_KEY: Boolean(supabaseAnonKey),
      VITE_FMP_API_KEY: Boolean(process.env.VITE_FMP_API_KEY),
      VITE_FINNHUB_API_KEY: Boolean(process.env.VITE_FINNHUB_API_KEY),
      VITE_ALPHA_VANTAGE_API_KEY: Boolean(process.env.VITE_ALPHA_VANTAGE_API_KEY)
    }
  });
}
