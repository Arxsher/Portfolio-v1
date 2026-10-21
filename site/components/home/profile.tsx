// Home intro, part 1: the status line and the name.
//
//   ● Available for work                    Local time · 18:53 GMT+1
//
//   Zakaria
//   Full-stack developer & designer                          [photo]
//
// The name and title are one heading in two tones (id "intro-heading": it
// names the intro section that app/page.tsx wraps around Profile, Intro and
// IntroLab). The name is set by NameWave (name-wave.tsx): its letters swell
// in Geist's weight axis under the pointer; it reads as plain text to screen
// readers and is static under reduced motion. The photo only shows once
// site.avatar points at one. Below 360px "Local time" is left to screen
// readers so the line stays on one row.

import { LocalClock } from "@/components/home/intro-clock";
import { NameWave } from "@/components/home/name-wave";
import { site } from "@/content/site";

/** Short zone name ("GMT+1") at build time; only sizes the clock slot before it hydrates. */
function shortZoneName(timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone, timeZoneName: "short" }).formatToParts(new Date());
    return parts.find((part) => part.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

export function Profile() {
  const { timeZone, label } = site.status;
  const avatar: string = site.avatar;

  return (
    <div className="mt-10 sm:mt-16">
      <div className="flex items-center justify-between gap-3 text-[13px] text-tertiary">
        <p className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="size-1.5 shrink-0 rounded-full bg-status shadow-[0_0_0_3px_color-mix(in_oklab,var(--status)_18%,transparent)]"
          />
          <span className="whitespace-nowrap text-secondary">{label}</span>
        </p>
        <p className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
          <span className="sr-only min-[360px]:not-sr-only">Local time</span>
          <span aria-hidden="true" className="hidden opacity-60 min-[360px]:inline">
            ·
          </span>
          <LocalClock timeZone={timeZone} zoneFallback={shortZoneName(timeZone)} />
        </p>
      </div>

      <div className="mt-5 flex items-end justify-between gap-6 sm:mt-6">
        <h1
          id="intro-heading"
          className="text-[28px]/[1.14] font-medium tracking-[-0.03em] text-balance text-primary sm:text-[34px]/[1.12]"
        >
          <NameWave text={site.name} />{" "}
          <span className="block text-tertiary">{site.title}</span>
        </h1>
        {avatar ? (
          <img
            src={avatar}
            alt=""
            width={56}
            height={56}
            fetchPriority="high"
            decoding="async"
            className="size-14 shrink-0 rounded-[16px] bg-tile object-cover outline -outline-offset-1 outline-black/10 dark:outline-white/10"
          />
        ) : null}
      </div>
    </div>
  );
}
