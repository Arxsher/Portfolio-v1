// Hours and minutes in Casablanca for the board's clock.
import { site } from "@/content/site";

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: site.status.timeZone,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function casaTime(seconds: number): { hh: string; mm: string } | null {
  if (!seconds) return null;
  const [hh, mm] = timeFormat.format(new Date(seconds * 1000)).split(":");
  return { hh, mm };
}
