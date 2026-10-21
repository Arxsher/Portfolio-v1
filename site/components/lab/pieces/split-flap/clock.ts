// Ashh's local time for the board's clock bay, read from the browser's
// own time-zone data (site.status.timeZone): hours and minutes for the
// drums, the zone ("GMT+1") and the day ("Tue 20 Oct") for the legend.
import { site } from "@/content/site";

const make = (options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat | null => {
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone: site.status.timeZone, ...options });
  } catch {
    return null; // an unknown zone: the board keeps its clock blank
  }
};

const timeFormat = make({ hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZoneName: "short" });
const dayFormat = make({ weekday: "short", day: "numeric", month: "short" });

export type LocalTime = {
  hh: string;
  mm: string;
  /** "GMT+1" */
  zone: string;
  /** "Tue 20 Oct" */
  day: string;
};

export function localTime(seconds: number): LocalTime | null {
  if (!seconds || !timeFormat) return null;
  const date = new Date(seconds * 1000);
  let hh = "";
  let mm = "";
  let zone = "";
  for (const part of timeFormat.formatToParts(date)) {
    if (part.type === "hour") hh = part.value;
    else if (part.type === "minute") mm = part.value;
    else if (part.type === "timeZoneName") zone = part.value;
  }
  if (hh.length !== 2 || mm.length !== 2) return null;
  const day = dayFormat ? dayFormat.format(date).replace(",", "") : "";
  return { hh, mm, zone, day };
}
