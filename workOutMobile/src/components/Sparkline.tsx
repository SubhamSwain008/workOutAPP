export default function Sparkline({
  data, height = 28, width = 88, stroke = "var(--primary)",
}: {
  data: number[];
  height?: number;
  width?: number;
  stroke?: string;
}) {
  if (data.length < 2) {
    return (
      <svg width={width} height={height} className="block">
        <line x1="0" y1={height - 1} x2={width} y2={height - 1} stroke="var(--border)" />
      </svg>
    );
  }
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((d, i) => {
    const x = i * stepX;
    const y = height - 2 - ((d - min) / range) * (height - 4);
    return [x, y] as const;
  });
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1]!;
  const fill = `${d} L${width},${height} L0,${height} Z`;
  const gradId = `sl-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg width={width} height={height} className="block">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gradId})`} />
      <path d={d} stroke={stroke} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={2.4} fill={stroke} />
    </svg>
  );
}
