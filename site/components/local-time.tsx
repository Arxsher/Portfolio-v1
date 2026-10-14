"use client";

// Casablanca's local time, inline: "14:32 GMT+1", the colon breathing.
// Renders "--:--" on the server and until mounted, so the static HTML and
// the first client render match. Use it in the hero's arch caption and the
// postcard's postmark only (DESIGN.md: the time appears in two places).
//
//   <LocalTime />                "14:32 GMT+1"
//   <LocalTime zone={false} />   "14:32"
//   <LocalTime part />           "14:32 GMT+1, evening"

import { casaTime, useNow } from "@/lib/clock";
import { cn } from "@/lib/cn";

export function LocalTime({
  zone = true,
  part = false,
  className,
}: {
  zone?: boolean;
  part?: boolean;
  className?: string;
}) {
  const time = casaTime(useNow());
  return (
    <span className={cn("clock", className)}>
      {time ? (
        <>
          <time dateTime={`${time.hh}:${time.mm}`}>
            {time.hh}
            <span className="clock__colon" aria-hidden="true">
              :
            </span>
            <span className="sr-only">:</span>
            {time.mm}
          </time>
          {zone ? <span> {time.zone}</span> : null}
          {part ? <span>, {time.part}</span> : null}
        </>
      ) : (
        <span aria-hidden="true">--:--</span>
      )}
    </span>
  );
}
