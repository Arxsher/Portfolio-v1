// Home hero, part 2: avatar, name (+ verified badge), title and the
// availability pill with Zakaria's local time.
//
//   [avatar]  Zakaria ✓
//             Full-stack developer & designer
//   ( ● Available for work · 8:28am GMT+1 )

import Image from "next/image";
import { LocalTime } from "@/components/home/hero-client";
import { Verified } from "@/components/icons";
import { site } from "@/content/site";

/** Short zone name ("GMT+1") at build time; only used to size the clock slot before it hydrates. */
function shortZoneName(timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" }).formatToParts(new Date());
    return parts.find((part) => part.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

export function Profile() {
  const { timeZone, label } = site.status;

  return (
    <section className="mt-6">
      <div className="flex items-center gap-4">
        <span className="relative size-16 shrink-0 overflow-hidden rounded-[20px] bg-surface outline -outline-offset-1 outline-black/10 dark:outline-white/10">
          <Image
            src={site.avatar}
            alt=""
            width={64}
            height={64}
            loading="eager"
            fetchPriority="high"
            className="size-full object-cover"
          />
        </span>
        <div className="min-w-0">
          <h1 className="text-[22px] leading-tight font-medium tracking-[-0.02em] text-primary">
            {site.name}
            {site.verified ? (
              // The check is drawn in the page colour so it reads as cut out of the badge.
              <Verified size={17} className="ms-1.5 inline align-[-2px] text-verified [&>path+path]:stroke-background" />
            ) : null}
          </h1>
          <p className="mt-0.5 text-[15px] text-secondary">{site.title}</p>
        </div>
      </div>

      <p className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-surface py-1.5 ps-2.5 pe-3 text-[13px] whitespace-nowrap">
        <span aria-hidden="true" className="relative flex size-2 text-status">
          <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-60 motion-reduce:animate-none" />
          <span className="relative size-2 rounded-full bg-current" />
        </span>
        <span className="font-medium text-primary">{label}</span>
        <LocalTime timeZone={timeZone} zoneFallback={shortZoneName(timeZone)} />
      </p>
    </section>
  );
}
