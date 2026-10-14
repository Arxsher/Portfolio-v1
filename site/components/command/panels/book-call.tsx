"use client";

// "Book a call", the second tab of the contact sheet.
//
// With site.calLink set it holds the cal.com month view in a sand well,
// with a calendar-shaped skeleton until the embed has loaded. Without one
// it says so plainly: no calendar is connected yet, so it offers an email
// with a few times in it (the mail app opens with a short template) or
// the note form instead.

import { useMemo, useState } from "react";
import { Arrow } from "@/components/ornament";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { useResolvedTheme } from "@/lib/theme";

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
  const bone = "rounded-[5px] bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]";
  return (
    <div
      aria-hidden="true"
      className={cn(
        "skeleton pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out",
        hidden ? "opacity-0" : "opacity-100",
      )}
    >
      <div className="flex size-full flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className={cn(bone, "size-8 rounded-full")} />
          <div className="space-y-1.5">
            <span className={cn(bone, "block h-3 w-24")} />
            <span className={cn(bone, "block h-3.5 w-36")} />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className={cn(bone, "h-4 w-28")} />
          <span className="flex gap-1.5">
            <span className={cn(bone, "size-7 rounded-full")} />
            <span className={cn(bone, "size-7 rounded-full")} />
          </span>
        </div>
        <div className="grid flex-1 grid-cols-7 content-start gap-1.5">
          {dimmed.map((dim, index) => (
            <span key={index} className={cn(bone, "aspect-square max-h-11 w-full", dim && "opacity-45")} />
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
    <div className="relative h-[min(460px,52vh)] overflow-hidden rounded-paper bg-band max-sm:h-[60vh]">
      <iframe
        key={src}
        src={src}
        title={`Book a call with ${site.name}: a calendar`}
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

const TEMPLATE = `Hi ${site.name},\n\nCould we talk? A few times that work for me:\n\n- \n- \n- \n\nMy time zone: `;

function NoCalendar({ onWriteInstead }: { onWriteInstead: () => void }) {
  const href = `mailto:${site.email}?subject=${encodeURIComponent("A call")}&body=${encodeURIComponent(TEMPLATE)}`;
  return (
    <div className="rounded-paper bg-band px-6 py-7 text-center">
      <p className="serif-italic text-[26px] leading-[1.15] text-primary">No calendar connected yet.</p>
      <p className="mx-auto mt-2 max-w-[42ch] text-[15px] leading-[1.55] text-body">
        Send two or three times that suit you, with your time zone, and we can set the call up by email. I am in
        Casablanca.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <a href={href} className="btn btn-solid">
          Email some times
          <Arrow />
        </a>
        <button type="button" onClick={onWriteInstead} className="btn btn-ghost">
          Write a note instead
        </button>
      </div>
    </div>
  );
}

export function BookCall({
  onWriteInstead,
  calLink = site.calLink,
}: {
  onWriteInstead: () => void;
  /** Defaults to site.calLink. */
  calLink?: string;
}) {
  if (calLink) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-small text-muted">Choose a free slot; times show in your own time zone.</p>
        <CalEmbed link={calLink} />
      </div>
    );
  }
  return <NoCalendar onWriteInstead={onWriteInstead} />;
}
