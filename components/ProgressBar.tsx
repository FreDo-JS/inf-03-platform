export function ProgressBar({
  value,
  max,
  label,
  size = "md",
}: {
  value: number;
  max: number;
  label?: string;
  size?: "sm" | "md";
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      {label !== undefined && (
        <div className="mb-2 flex items-baseline justify-between gap-2 text-sm">
          <span className="text-muted">{label}</span>
          <span className="shrink-0 font-mono text-xs text-muted">
            <span className="text-base font-semibold text-fg">{value}</span>/{max}
            <span className="ml-2 text-accent">{pct}%</span>
          </span>
        </div>
      )}
      <div
        className={`overflow-hidden rounded-full bg-white/[0.06] ${size === "sm" ? "h-1.5" : "h-2.5"}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
