import { NextResponse } from "next/server";
import { runDailyResearch } from "@/lib/researchAgent";
import { readAccount, writeAccount } from "@/lib/store";
import { applySimulatedTrade, computeMetrics } from "@/lib/tradingEngine";

export async function GET() {
  const account = await readAccount();
  const research = await runDailyResearch(account.settings);
  return NextResponse.json({ research });
}

export async function POST() {
  const account = await readAccount();
  const research = await runDailyResearch(account.settings);
  const strongestIdea = research.strongestIdea?.idea;
  const nextAccount = strongestIdea ? await applySimulatedTrade(account, strongestIdea) : account;
  const stampedAccount = { ...nextAccount, lastStudyAt: research.generatedAt };
  await writeAccount(stampedAccount);
  const metrics = await computeMetrics(stampedAccount);

  return NextResponse.json({
    research,
    account: stampedAccount,
    metrics,
    message: "Daily research completed with simulated paper-trading rules. No real orders were placed."
  });
}
