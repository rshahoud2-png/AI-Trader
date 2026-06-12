import type { ApiKeys, RiskSettings } from '../types';

const keyName = 'ai-penny-terminal-settings';

export interface PersistedSettings {
  apiKeys: ApiKeys;
  risk: RiskSettings;
  watchlist: string[];
}

export const defaultSettings: PersistedSettings = {
  apiKeys: {
    fmp: '',
    finnhub: '',
    alphaVantage: ''
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
