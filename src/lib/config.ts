import type { ApiKeys, RiskSettings } from '../types';

const keyName = 'ai-penny-terminal-settings';

export interface PersistedSettings {
  apiKeys: ApiKeys;
  risk: RiskSettings;
  watchlist: string[];
}

export const defaultSettings: PersistedSettings = {
  apiKeys: {
    fmp: import.meta.env.VITE_FMP_API_KEY || '',
    finnhub: import.meta.env.VITE_FINNHUB_API_KEY || '',
    alphaVantage: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || ''
  },
  risk: {
    scannerMaxPrice: Number(import.meta.env.VITE_DEFAULT_MAX_PRICE || 5),
    minVolume: 500000,
    startingCash: Number(import.meta.env.VITE_DEFAULT_STARTING_CASH || 1000),
    riskPerTrade: 0.02,
    maxPositionPct: 0.2
  },
  watchlist: ['SNDL', 'BITF', 'OPEN', 'PSNY', 'SOFI', 'DNA']
};

export function loadSettings(): PersistedSettings {
  const raw = localStorage.getItem(keyName);
  if (!raw) return defaultSettings;
  try {
    const parsed = JSON.parse(raw) as PersistedSettings;
    return {
      apiKeys: { ...defaultSettings.apiKeys, ...parsed.apiKeys },
      risk: { ...defaultSettings.risk, ...parsed.risk },
      watchlist: parsed.watchlist?.length ? parsed.watchlist : defaultSettings.watchlist
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: PersistedSettings) {
  localStorage.setItem(keyName, JSON.stringify(settings));
}

export function hasAnyMarketKey(keys: ApiKeys) {
  return Boolean(keys.fmp || keys.finnhub || keys.alphaVantage);
}

export function hasPrimaryScannerKey(keys: ApiKeys) {
  return Boolean(keys.fmp);
}
