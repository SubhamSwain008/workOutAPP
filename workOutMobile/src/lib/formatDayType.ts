/** Normalize day_type_name into a string[] regardless of legacy formats. */
export function toDayTypeArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        // fall through to delimiter split
      }
    }
    return trimmed.split(/[/,]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export const formatDayType = (value: unknown): string =>
  toDayTypeArray(value).join(" / ");
