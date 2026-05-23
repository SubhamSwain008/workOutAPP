import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PageHeader({
  title,
  subtitle,
  back,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="px-5 pt-safe pt-4 pb-3 flex items-center gap-3">
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
        <h1 className="text-2xl font-extrabold tracking-tight truncate">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
