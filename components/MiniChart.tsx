export function MiniChart({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  return (
    <div className="flex h-32 items-end gap-1 rounded border border-line bg-ink/70 p-3">
      {values.map((value, index) => (
        <div
          key={`${value}-${index}`}
          className="flex-1 rounded-t bg-cyan/70"
          style={{ height: `${18 + ((value - min) / range) * 82}%` }}
          title={value.toFixed(2)}
        />
      ))}
    </div>
  );
}
