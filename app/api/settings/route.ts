import { NextRequest, NextResponse } from "next/server";
import { readAccount, updateSettings } from "@/lib/store";
import { computeMetrics } from "@/lib/tradingEngine";

export async function GET() {
  const account = await readAccount();
  return NextResponse.json({ settings: account.settings });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const account = await updateSettings({
    startingBalance: Number(body.startingBalance),
    dailyTargetPercent: Number(body.dailyTargetPercent),
    riskPerTradePercent: Number(body.riskPerTradePercent),
    maxDailyLossPercent: Number(body.maxDailyLossPercent),
    watchlist: String(body.watchlist ?? "")
      .split(",")
      .map((symbol) => symbol.trim().toUpperCase())
      .filter(Boolean)
  });
  const metrics = await computeMetrics(account);
  return NextResponse.json({ account, metrics });
}
