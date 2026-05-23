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
      <div className="absolute inset-0 bg-black/50 fade-in" onClick={onClose} />
      <div
        className="relative w-full max-w-md bg-card text-card-foreground rounded-t-3xl border-t border-x border-border shadow-lg slide-up"
        style={{ paddingBottom: "var(--safe-bottom)" }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="press h-9 w-9 grid place-items-center rounded-full bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto thin-scrollbar">{children}</div>
      </div>
    </div>
  );
}
