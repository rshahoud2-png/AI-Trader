import type { Trade } from "@/lib/types";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function TradeTable({ trades }: { trades: Trade[] }) {
  return (
    <div className="overflow-hidden rounded border border-line bg-panel/90">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-panel2 text-xs uppercase tracking-[0.16em] text-slate-400">
          <tr>
            <th className="px-4 py-3">Symbol</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Qty</th>
            <th className="px-4 py-3">Entry</th>
            <th className="px-4 py-3">Exit</th>
            <th className="px-4 py-3">Stop</th>
            <th className="px-4 py-3">Target</th>
            <th className="px-4 py-3">Confidence</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line text-slate-200">
          {trades.map((trade) => (
            <tr key={trade.id} className="hover:bg-panel2/60">
              <td className="px-4 py-3 font-semibold text-white">{trade.symbol}</td>
              <td className="px-4 py-3 capitalize">{trade.action}</td>
              <td className="px-4 py-3">{trade.quantity}</td>
              <td className="px-4 py-3">{money.format(trade.entryPrice)}</td>
              <td className="px-4 py-3">{trade.exitPrice ? money.format(trade.exitPrice) : "-"}</td>
              <td className="px-4 py-3">{money.format(trade.stopLoss)}</td>
              <td className="px-4 py-3">{money.format(trade.takeProfit)}</td>
              <td className="px-4 py-3">{trade.confidence}%</td>
              <td className="px-4 py-3 capitalize">{trade.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
