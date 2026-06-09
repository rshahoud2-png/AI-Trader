import type { Position } from "@/lib/types";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function PositionTable({ positions }: { positions: Position[] }) {
  if (positions.length === 0) {
    return <div className="rounded border border-line bg-panel/90 p-6 text-sm text-slate-400">No open paper positions.</div>;
  }

  return (
    <div className="overflow-hidden rounded border border-line bg-panel/90">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-panel2 text-xs uppercase tracking-[0.16em] text-slate-400">
          <tr>
            <th className="px-4 py-3">Symbol</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Qty</th>
            <th className="px-4 py-3">Entry</th>
            <th className="px-4 py-3">Current</th>
            <th className="px-4 py-3">Value</th>
            <th className="px-4 py-3">Unrealized P/L</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line text-slate-200">
          {positions.map((position) => (
            <tr key={position.symbol} className="hover:bg-panel2/60">
              <td className="px-4 py-3 font-semibold text-white">{position.symbol}</td>
              <td className="px-4 py-3 capitalize">{position.assetType}</td>
              <td className="px-4 py-3">{position.quantity}</td>
              <td className="px-4 py-3">{money.format(position.entryPrice)}</td>
              <td className="px-4 py-3">{money.format(position.currentPrice)}</td>
              <td className="px-4 py-3">{money.format(position.marketValue)}</td>
              <td className={`px-4 py-3 ${position.unrealizedPnl >= 0 ? "text-mint" : "text-danger"}`}>
                {money.format(position.unrealizedPnl)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
