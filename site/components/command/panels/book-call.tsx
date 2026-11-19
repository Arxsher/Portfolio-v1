"use client";

// "Book a call": the cal.com month view in a rounded well, with a calendar
// shaped skeleton until the embed has loaded. Without site.calLink the
// same well holds a short note and a way over to "Say hi".

import { useMemo, useState } from "react";
import { Calendar } from "@/components/icons";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { useResolvedTheme } from "@/lib/theme";
import { VIEWS } from "../items";
import { Panel, panelButtonClass } from "./panel";

const wellClass = "relative h-[min(460px,52vh)] overflow-hidden rounded-[16px] bg-tile";

/** Which of the 35 skeleton days read as unavailable: days gone by and weekends. */
function useDimmedDays(): boolean[] {
  return useMemo(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7; // weeks start on Monday
    return Array.from({ length: 35 }, (_, index) => {
      const column = index % 7;
      const day = index - lead + 1;
      return column >= 5 || day < now.getDate();
    });
  }, []);
}

function CalendarSkeleton({ hidden }: { hidden: boolean }) {
  const dimmed = useDimmedDays();
  const bone = "skeleton bg-well";
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out",
        hidden ? "opacity-0" : "opacity-100",
      )}
    >
      <div className="flex size-full animate-fade-in [animation-delay:150ms] [animation-duration:300ms] flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className={cn(bone, "size-8 rounded-full")} />
          <div className="space-y-1.5">
            <span className={cn(bone, "block h-3 w-24 rounded-[6px]")} />
            <span className={cn(bone, "block h-3.5 w-36 rounded-[6px]")} />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className={cn(bone, "h-4 w-28 rounded-[6px]")} />
          <span className="flex gap-1.5">
            <span className={cn(bone, "size-7 rounded-[8px]")} />
            <span className={cn(bone, "size-7 rounded-[8px]")} />
          </span>
        </div>
        <div className="grid flex-1 grid-cols-7 content-start gap-1.5">
          {dimmed.map((dim, index) => (
            <span key={index} className={cn(bone, "aspect-square max-h-11 w-full rounded-[8px]", dim && "opacity-50")} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CalEmbed({ link }: { link: string }) {
  const theme = useResolvedTheme();
  const [loadedSrc, setLoadedSrc] = useState("");
  const src = `https://cal.com/${link.replace(/^\/+|\/+$/g, "")}?embed=true&layout=month_view&theme=${theme}`;
  const loaded = loadedSrc === src;

  return (
    <div className={wellClass}>
      <iframe
        key={src}
        src={src}
        title={VIEWS["book-call"].title}
        allow="payment"
        onLoad={() => setLoadedSrc(src)}
        className={cn(
          "absolute inset-0 size-full border-0 transition-opacity duration-300 ease-out",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
      <CalendarSkeleton hidden={loaded} />
    </div>
  );
}

function NoCalendar({ onSayHi }: { onSayHi: () => void }) {
  return (
    <div className="flex h-[min(280px,40vh)] min-h-[220px] flex-col items-center justify-center rounded-[16px] bg-tile px-6 text-center">
      <span className="mb-3 flex size-10 items-center justify-center rounded-[12px] bg-float text-primary shadow-lift">
        <Calendar size={16} />
      </span>
      <p className="text-[15px] font-medium text-primary">No booking calendar yet</p>
      <p className="mt-1 max-w-[320px] text-[13px] leading-[1.5] text-secondary">
        Calls can’t be booked from here for now. Send me a note instead and we’ll find a time that works.
      </p>
      <button type="button" onClick={onSayHi} className={cn(panelButtonClass, "mt-4")}>
        Say hi instead
      </button>
    </div>
  );
}

export function BookCallPanel({
  onClose,
  onSayHi,
  calLink = site.calLink,
}: {
  onClose: () => void;
  onSayHi: () => void;
  /** Defaults to site.calLink. */
  calLink?: string;
}) {
  const info = VIEWS["book-call"];
  return (
    <Panel title={info.title} description={info.description} icon="calendar" onClose={onClose}>
      {calLink ? <CalEmbed link={calLink} /> : <NoCalendar onSayHi={onSayHi} />}
    </Panel>
  );
}
