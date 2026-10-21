// Small formatting helpers shared by the guest house and the register.

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** "13 Oct 2026". */
export function formatEntryDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : dateFormat.format(date);
}

/** "No. 07": a guest's window number (1-based), at least two digits. */
export function windowNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}
