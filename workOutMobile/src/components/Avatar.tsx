/** Deterministic gradient avatar based on the input string. */
export default function Avatar({
  name, size = 44, className = "",
}: { name: string | null | undefined; size?: number; className?: string }) {
  const text = (name ?? "?").trim() || "?";
  const initial = text.slice(0, 2).toUpperCase();
  // Hash → hue
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const bg = `linear-gradient(135deg, hsl(${hue} 80% 58%) 0%, hsl(${(hue + 40) % 360} 80% 48%) 100%)`;
  return (
    <div
      className={`grid place-items-center text-white font-display font-bold ${className}`}
      style={{
        width: size, height: size, background: bg, borderRadius: size * 0.32,
        fontSize: size * 0.36,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18), 0 4px 14px -6px rgba(0,0,0,0.5)",
      }}
      aria-hidden
    >
      {initial}
    </div>
  );
}
