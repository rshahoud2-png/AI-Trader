"use client";

import { useEffect, useState, type ReactNode } from "react";

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
  const [expanded, setExpanded] = useState(false);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setPulse((current) => current + 1), 1200);
    return () => window.clearInterval(timer);
  }, []);

  const toneClass = {
    neutral: "text-slate-100",
    positive: "text-mint",
    negative: "text-danger",
    warning: "text-amber"
  }[tone];

  const activity = 40 + Math.round(Math.abs(Math.sin((pulse + label.length) / 2)) * 55);

  return (
    <button
      type="button"
      onClick={() => setExpanded((current) => !current)}
      className={`rounded border bg-panel/90 p-4 text-left shadow-glow transition hover:-translate-y-0.5 hover:border-cyan/60 ${
        expanded ? "border-cyan" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className={`mt-3 text-2xl font-semibold ${toneClass}`}>{value}</p>
        </div>
        {icon ? <div className="rounded border border-line bg-panel2 p-2 text-cyan">{icon}</div> : null}
      </div>
      <p className="mt-3 text-sm text-slate-400">{detail}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded bg-ink ring-1 ring-line">
        <div className="h-full rounded bg-cyan transition-all duration-700" style={{ width: `${activity}%` }} />
      </div>
      {expanded ? (
        <div className="mt-3 rounded border border-line bg-ink/70 p-3 text-xs leading-5 text-slate-400">
          Live UI activity: <span className="font-semibold text-cyan">{activity}%</span>. Click again to collapse this panel.
        </div>
      ) : null}
    </button>
  );
}
