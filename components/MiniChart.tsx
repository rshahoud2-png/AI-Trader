export function MiniChart({ values }: { values: number[] }) {
  if (!values.length) {
    return (
      <div className="flex h-44 items-center justify-center rounded border border-line bg-ink/70 p-4 text-sm text-slate-500">
        Waiting for live market bars
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const latest = values.at(-1) ?? 0;
  const first = values[0] ?? latest;
  const positive = latest >= first;

  return (
    <div className="rounded border border-line bg-ink/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Latest close</p>
          <p className="mt-1 text-2xl font-semibold text-white">${latest.toFixed(2)}</p>
        </div>
        <span className={`rounded border px-3 py-1 text-sm font-semibold ${positive ? "border-mint/30 bg-mint/10 text-mint" : "border-danger/30 bg-danger/10 text-danger"}`}>
          {positive ? "+" : ""}{(((latest - first) / first) * 100).toFixed(2)}%
        </span>
      </div>
      <div className="flex h-36 items-end gap-1">
        {values.map((value, index) => {
          const height = 14 + ((value - min) / range) * 86;
          const isLast = index === values.length - 1;
          return (
            <div
              key={`${value}-${index}`}
              className={`flex-1 rounded-t transition hover:opacity-100 ${isLast ? "bg-cyan" : positive ? "bg-mint/60" : "bg-danger/60"}`}
              style={{ height: `${height}%`, opacity: isLast ? 1 : 0.72 }}
              title={`$${value.toFixed(2)}`}
            />
          );
        })}
      </div>
    </div>
  );
}
