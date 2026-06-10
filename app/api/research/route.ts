import { NextResponse } from "next/server";
import { runDailyResearch } from "@/lib/researchAgent";
import { readAccount, writeAccount } from "@/lib/store";
import { applySimulatedTrade, computeMetrics } from "@/lib/tradingEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const account = await readAccount();
    const research = await runDailyResearch(account.settings);
    return NextResponse.json({ research });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to complete live market research." },
      { status: 503 }
    );
  }
}

export async function POST() {
  try {
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
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to run live market study." },
      { status: 503 }
    );
  }
}
