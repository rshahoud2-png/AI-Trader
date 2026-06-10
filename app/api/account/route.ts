import { NextResponse } from "next/server";
import { readAccount } from "@/lib/store";
import { computeMetrics } from "@/lib/tradingEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const account = await readAccount();
    const metrics = await computeMetrics(account);
    return NextResponse.json({ account, metrics });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load live account metrics." },
      { status: 503 }
    );
  }
}
