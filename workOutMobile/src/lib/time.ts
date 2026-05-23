// Server expects ISO with offset (RFC 3339). new Date().toISOString() returns UTC Z,
// which Zod's .datetime({offset:true}) accepts.
export const nowIso = (): string => new Date().toISOString();

const IST_OFFSET_MIN = 5 * 60 + 30;

/** Return YYYY-MM-DD in IST (matches the web app's display). */
export function istDateString(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60_000;
  const ist = new Date(utcMs + IST_OFFSET_MIN * 60_000);
  const y = ist.getFullYear();
  const m = String(ist.getMonth() + 1).padStart(2, "0");
  const day = String(ist.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function istLabel(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeFromNow(iso: string | null): string {
  if (!iso) return "never";
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  if (diff < 0) return "just now";
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
