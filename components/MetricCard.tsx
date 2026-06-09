import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  detail,
  tone = "neutral",
  icon
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "positive" | "negative" | "warning";
  icon?: ReactNode;
}) {
  const toneClass = {
    neutral: "text-slate-100",
    positive: "text-mint",
    negative: "text-danger",
    warning: "text-amber"
  }[tone];

  return (
    <div className="rounded border border-line bg-panel/90 p-4 shadow-glow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className={`mt-3 text-2xl font-semibold ${toneClass}`}>{value}</p>
        </div>
        {icon ? <div className="rounded border border-line bg-panel2 p-2 text-cyan">{icon}</div> : null}
      </div>
      <p className="mt-3 text-sm text-slate-400">{detail}</p>
    </div>
  );
}
