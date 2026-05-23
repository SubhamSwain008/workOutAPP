import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export default function StatCard({
  icon: Icon, label, value, unit, trend, accent = "primary", footer,
}: {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  unit?: string;
  trend?: { value: string; positive?: boolean } | null;
  accent?: "primary" | "success" | "warning" | "destructive" | "muted";
  footer?: ReactNode;
}) {
  const accentColor =
    accent === "success" ? "var(--success)" :
    accent === "warning" ? "var(--warning)" :
    accent === "destructive" ? "var(--destructive)" :
    accent === "muted" ? "var(--muted-foreground)" :
    "var(--primary)";

  return (
    <div className="surface p-4 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">{label}</span>
        {Icon && (
          <span
            className="h-7 w-7 grid place-items-center rounded-lg"
            style={{ background: `color-mix(in srgb, ${accentColor} 14%, transparent)`, color: accentColor }}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-display text-[28px] leading-none tabular-nums">{value}</span>
        {unit && <span className="text-xs text-muted-foreground font-medium">{unit}</span>}
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={`text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md ${
              trend.positive ? "text-success" : "text-destructive"
            }`}
            style={{ background: trend.positive
              ? "color-mix(in srgb, var(--success) 12%, transparent)"
              : "color-mix(in srgb, var(--destructive) 12%, transparent)" }}
          >
            {trend.positive ? "▲" : "▼"} {trend.value}
          </span>
        </div>
      )}
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}
