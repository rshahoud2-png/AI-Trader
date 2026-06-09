import { promises as fs } from "fs";
import path from "path";
import type { AccountState, Settings } from "./types";

const dataPath = path.join(process.cwd(), "data", "paper-account.json");

export const defaultSettings: Settings = {
  startingBalance: 1000,
  dailyTargetPercent: 20,
  riskPerTradePercent: 2,
  maxDailyLossPercent: 5,
  watchlist: ["AAPL", "MSFT", "NVDA", "TSLA", "BTC", "ETH"]
};

export const defaultAccount: AccountState = {
  cash: 1000,
  settings: defaultSettings,
  trades: [
    {
      id: "seed-aapl-open",
      symbol: "AAPL",
      assetType: "stock",
      action: "buy",
      quantity: 1.05,
      entryPrice: 204.8,
      stopLoss: 198.65,
      takeProfit: 217.09,
      reason: "Seed simulated trade: bullish moving-average trend with controlled paper risk.",
      confidence: 72,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      status: "open"
    },
    {
      id: "seed-eth-closed",
      symbol: "ETH",
      assetType: "crypto",
      action: "buy",
      quantity: 0.06,
      entryPrice: 3835,
      exitPrice: 3925,
      stopLoss: 3720,
      takeProfit: 4065,
      reason: "Seed simulated trade: momentum study closed for example reporting.",
      confidence: 68,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
      status: "closed",
      realizedPnl: 5.4
    }
  ]
};

export async function readAccount(): Promise<AccountState> {
  try {
    const raw = await fs.readFile(dataPath, "utf8");
    return JSON.parse(raw) as AccountState;
  } catch {
    await writeAccount(defaultAccount);
    return defaultAccount;
  }
}

export async function writeAccount(account: AccountState) {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, `${JSON.stringify(account, null, 2)}\n`, "utf8");
}

export async function updateSettings(settings: Partial<Settings>) {
  const account = await readAccount();
  const nextStartingBalance = Number(settings.startingBalance ?? account.settings.startingBalance);
  const nextSettings: Settings = {
    ...account.settings,
    ...settings,
    startingBalance: nextStartingBalance,
    dailyTargetPercent: Number(settings.dailyTargetPercent ?? account.settings.dailyTargetPercent),
    riskPerTradePercent: Number(settings.riskPerTradePercent ?? account.settings.riskPerTradePercent),
    maxDailyLossPercent: Number(settings.maxDailyLossPercent ?? account.settings.maxDailyLossPercent),
    watchlist: settings.watchlist ?? account.settings.watchlist
  };

  const balanceDelta = nextStartingBalance - account.settings.startingBalance;
  const nextAccount: AccountState = {
    ...account,
    cash: account.cash + balanceDelta,
    settings: nextSettings
  };

  await writeAccount(nextAccount);
  return nextAccount;
}
