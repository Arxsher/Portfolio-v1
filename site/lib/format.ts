// Formatting helpers. Dates are formatted in UTC so a "2026-05-04" stays
// May 4 whatever the visitor's (or the build machine's) time zone is.

const ISO_DATE = /^\d{4}-\d{2}(-\d{2})?$/;

function toDate(value: string | Date): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const trimmed = value.trim();
  if (ISO_DATE.test(trimmed)) {
    const [y, m, d = "01"] = trimmed.split("-");
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  // Strings without a time ("August 2026") parse as local midnight; move
  // them to UTC midnight so the UTC formatters below keep the same day.
  return /\d{1,2}:\d{2}/.test(trimmed)
    ? parsed
    : new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
}

/** "2026-05-04" → "May 2026" (short month: "Aug 2026"). Unparseable input is returned as is. */
export function formatMonthYear(iso: string | Date, month: "short" | "long" = "short"): string {
  const date = toDate(iso);
  if (!date) return String(iso);
  return new Intl.DateTimeFormat("en-US", { month, year: "numeric", timeZone: "UTC" }).format(date);
}

/** "2026-05-04" → "May 4, 2026" (long month: "August 11, 2026"). Unparseable input is returned as is. */
export function formatDate(iso: string | Date, month: "short" | "long" = "long"): string {
  const date = toDate(iso);
  if (!date) return String(iso);
  return new Intl.DateTimeFormat("en-US", {
    month,
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** pad(6) → "06", pad(7, 4) → "0007". */
export function pad(n: number, width = 2): string {
  const sign = n < 0 ? "-" : "";
  return sign + String(Math.abs(Math.trunc(n))).padStart(width, "0");
}

/** 2388 → "2,388". */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
