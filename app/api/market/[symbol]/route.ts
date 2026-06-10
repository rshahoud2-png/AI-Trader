import { NextRequest, NextResponse } from "next/server";
import { fetchMarketCandles, inferAssetType } from "@/lib/mockMarket";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = await params;
    const normalized = symbol.trim().toUpperCase();
    const candles = await fetchMarketCandles(normalized);
    const latest = candles.at(-1);
    const previous = candles.at(-2) ?? candles.at(0) ?? latest;

    return NextResponse.json({
      symbol: normalized,
      assetType: inferAssetType(normalized),
      latest,
      previous,
      candles,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load Polygon market data." },
      { status: 503 }
    );
  }
}
