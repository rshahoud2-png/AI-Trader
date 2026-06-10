import { AlertTriangle } from "lucide-react";

export function WarningBanner() {
  return (
    <section className="mb-6 rounded border border-amber/40 bg-amber/10 p-4 text-amber shadow-glow">
      <div className="flex gap-3">
        <AlertTriangle className="mt-1 shrink-0" size={22} />
        <div>
          <h2 className="font-semibold text-amber">Paper Trading Only: live data, fake money, no real orders.</h2>
          <p className="mt-1 text-sm text-amber/90">
            This educational simulator starts with a $1,000 paper balance. The 20% daily target is unrealistic and not
            guaranteed. Nothing here is financial advice, a brokerage connection, or permission to place real trades.
          </p>
        </div>
      </div>
    </section>
  );
}
