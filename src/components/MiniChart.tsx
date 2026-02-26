import { useState, useRef, useEffect } from "react";

type MiniChartProps = {
  data: { label: string; value: number }[];
  title?: string;
  unit?: string;
  accentColor?: string;
};

export function MiniChart({
  data,
  title = "Activity",
  unit = "",
  accentColor = "bg-emerald-500",
}: MiniChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  useEffect(() => {
    if (hoveredIndex !== null) {
      setDisplayValue(data[hoveredIndex].value);
    }
  }, [hoveredIndex, data]);

  const handleContainerEnter = () => setIsHovering(true);
  const handleContainerLeave = () => {
    setIsHovering(false);
    setHoveredIndex(null);
    setTimeout(() => setDisplayValue(null), 150);
  };

  if (data.length === 0) return null;

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleContainerEnter}
      onMouseLeave={handleContainerLeave}
      className="group relative w-full p-5 rounded-2xl bg-foreground/2 border border-foreground/6 backdrop-blur-sm transition-all duration-500 hover:bg-foreground/4 hover:border-foreground/10 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${accentColor} animate-pulse`} />
          <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
            {title}
          </span>
        </div>
        <div className="relative h-7 flex items-center">
          <span
            className={`text-lg font-semibold tabular-nums transition-all duration-300 ease-out ${
              isHovering && displayValue !== null
                ? "opacity-100 text-foreground"
                : "opacity-50 text-muted-foreground"
            }`}
          >
            {displayValue !== null ? displayValue.toLocaleString() : ""}
            <span
              className={`text-xs font-normal text-muted-foreground ml-0.5 transition-opacity duration-300 ${
                displayValue !== null ? "opacity-100" : "opacity-0"
              }`}
            >
              {unit}
            </span>
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end gap-2 h-24">
        {data.map((item, index) => {
          const heightPx = (item.value / maxValue) * 96;
          const isHovered = hoveredIndex === index;
          const isAnyHovered = hoveredIndex !== null;
          const isNeighbor =
            hoveredIndex !== null &&
            (index === hoveredIndex - 1 || index === hoveredIndex + 1);

          return (
            <div
              key={`${item.label}-${index}`}
              className="relative flex-1 flex flex-col items-center justify-end h-full"
              onMouseEnter={() => setHoveredIndex(index)}
            >
              <div
                className={`w-full rounded-full cursor-pointer transition-all duration-300 ease-out origin-bottom ${
                  isHovered
                    ? "bg-foreground"
                    : isNeighbor
                      ? "bg-foreground/30"
                      : isAnyHovered
                        ? "bg-foreground/10"
                        : "bg-foreground/20 group-hover:bg-foreground/25"
                }`}
                style={{
                  height: `${heightPx}px`,
                  transform: isHovered
                    ? "scaleX(1.15) scaleY(1.02)"
                    : isNeighbor
                      ? "scaleX(1.05)"
                      : "scaleX(1)",
                }}
              />
              <span
                className={`text-[10px] font-medium mt-2 transition-all duration-300 ${
                  isHovered ? "text-foreground" : "text-muted-foreground/60"
                }`}
              >
                {item.label.length > 3 ? item.label.slice(0, 3) : item.label}
              </span>

              {/* Tooltip */}
              <div
                className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-foreground text-background text-xs font-medium transition-all duration-200 whitespace-nowrap z-10 ${
                  isHovered
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-1 pointer-events-none"
                }`}
              >
                {item.value.toLocaleString()}
                {unit}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtle glow */}
      <div className="absolute inset-0 rounded-2xl bg-linear-to-b from-foreground/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
}
