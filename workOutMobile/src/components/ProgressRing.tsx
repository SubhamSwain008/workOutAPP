export default function ProgressRing({
  value, max, size = 78, stroke = 7, label, sub, color = "var(--primary)",
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  label?: string;
  sub?: string;
  color?: string;
}) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / Math.max(1, max)));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="block -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="var(--muted)" strokeWidth={stroke} fill="none"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-display text-[18px] leading-none tabular-nums">{label ?? value}</div>
          {sub && <div className="text-[9px] mt-0.5 text-muted-foreground uppercase tracking-[0.1em] font-semibold">{sub}</div>}
        </div>
      </div>
    </div>
  );
}
