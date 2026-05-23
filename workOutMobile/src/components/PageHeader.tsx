import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PageHeader({
  title,
  subtitle,
  back,
  right,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div className={`px-5 pt-safe pb-2 ${compact ? "pt-3" : "pt-5"} flex items-center gap-3`}>
      {back ? (
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="press h-10 w-10 grid place-items-center rounded-full bg-muted text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      ) : null}
      <div className="flex-1 min-w-0">
        <h1 className={`font-display tracking-tight ${compact ? "text-xl" : "text-[26px] leading-tight"} font-extrabold`}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-[12px] text-muted-foreground mt-0.5 font-medium truncate">{subtitle}</p>
        )}
      </div>
      {right}
    </div>
  );
}
