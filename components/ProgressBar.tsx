export function ProgressBar({ value, targetLabel }: { value: number; targetLabel: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-300">Daily goal progress</span>
        <span className="font-semibold text-cyan">{clamped.toFixed(1)}%</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded bg-ink ring-1 ring-line">
        <div className="h-full rounded bg-cyan transition-all" style={{ width: `${clamped}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-400">{targetLabel}</p>
    </div>
  );
}
