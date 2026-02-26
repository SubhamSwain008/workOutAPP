/**
 * Robust helper to extract day types from `day_type_name` which may be:
 *   - a JS array: ["upper", "arms"]
 *   - a JSON string: '["upper"]'
 *   - a plain string: "upper"
 *   - null / undefined
 *
 * Returns a string[] for filtering, or a comma-joined string for display.
 */

export function getDayTypes(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        /* not valid JSON — fall through */
      }
    }
    return trimmed ? [trimmed] : [];
  }
  return [];
}

export function formatDayType(val: unknown): string {
  const arr = getDayTypes(val);
  return arr.length > 0 ? arr.join(", ") : "Workout";
}
