import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export default function Empty({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface p-8 text-center fade-in">
      <div
        className="mx-auto h-14 w-14 grid place-items-center rounded-2xl mb-4 text-primary"
        style={{ background: "color-mix(in srgb, var(--primary) 14%, transparent)" }}
      >
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-display font-bold mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      {action}
    </div>
  );
}
