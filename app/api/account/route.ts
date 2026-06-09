import { NextResponse } from "next/server";
import { readAccount } from "@/lib/store";
import { computeMetrics } from "@/lib/tradingEngine";

export async function GET() {
  const account = await readAccount();
  const metrics = await computeMetrics(account);
  return NextResponse.json({ account, metrics });
}
