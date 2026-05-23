import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export default function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm fade-in"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md bg-card text-card-foreground rounded-t-[28px] border-t border-x border-border-2 shadow-lg slide-up-md overflow-hidden"
        style={{ paddingBottom: "var(--safe-bottom)" }}
      >
        <div className="pt-2 pb-1 grid place-items-center">
          <span className="h-1 w-10 rounded-full bg-border" />
        </div>
        <div className="flex items-center justify-between px-5 pt-1 pb-3">
          <h3 className="text-base font-display font-bold tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="press h-9 w-9 grid place-items-center rounded-full bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[78vh] overflow-y-auto thin-scrollbar">{children}</div>
      </div>
    </div>
  );
}
