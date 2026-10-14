// The home hero (DESIGN.md → Home → Hero): Casablanca in words on the
// left, the city at dusk in an arched window on the right.
//
//   CASABLANCA, MOROCCO · الدار البيضاء · ✦ AVAILABLE FOR WORK      ✦
//   Zakari𝑎                                                     ╭────╮
//   Full-stack developer & designer                              │dusk│
//   I design and build software from Casablanca …                │    │
//   [✦ Write to me]  [See the work]                              ╰────╯
//                                                     Casablanca at dusk →   11:17 there now
//
// The name rises letter by letter (animate-rise), its last letter italic
// in terracotta. On phones the arch sits beside the kicker so it shows
// above the fold, and the name is 30vw.
//
// ---------------------------------------------------------------------
//  Swapping the hero scene
//  The window shows a live lab piece over a poster (hero-bits.tsx):
//    - HERO.piece is the lab slug mounted with LoadPiece in tile mode
//      (any slug from components/lab/registry.ts). null: poster only.
//    - <DuskPoster /> is what shows before the piece has drawn, if it
//      cannot start, and as the still behind it. For another piece pass
//      any element that fills its parent (`absolute inset-0`): a
//      code-drawn still, or <img alt="" className="absolute inset-0
//      size-full object-cover" />.
//    - HERO.href / caption / label describe it (the caption starts the
//      link's accessible name; the label tells screen readers what the
//      scene shows).
//  The window is a 100:125 ArchFrame, at most 420px wide (148–160px on
//  phones); whatever is mounted fills it and is cut to the arch.
// ---------------------------------------------------------------------

import { DuskPoster, HeroWindow, JumpLink } from "@/components/home/hero-bits";
import { LocalTime } from "@/components/local-time";
import { Star } from "@/components/ornament";
import { site } from "@/content/site";

const HERO = {
  piece: "dusk" as string | null,
  href: "/lab/dusk/",
  caption: "Casablanca at dusk",
  label:
    "The sun going down into the Atlantic beside the minaret on its point, the city to the east, drawn in dithered pixels.",
  nightLabel:
    "The same view after dark: the moon's road on the water, the minaret's lantern and the city's lit windows, drawn in dithered pixels.",
};

function Dot({ className }: { className?: string }) {
  return <span aria-hidden="true" className={`size-[3px] rounded-full bg-current opacity-60 ${className ?? ""}`} />;
}

export function Hero() {
  const letters = Array.from(site.name);
  const [before, after] = site.title.split(" & ");

  return (
    <section
      aria-labelledby="hero-title"
      className="grid grid-cols-[minmax(0,1fr)_clamp(132px,40vw,160px)] gap-x-4 pt-[clamp(28px,5vw,64px)] [grid-template-areas:'kicker_arch'_'name_name'_'title_title'_'lede_lede'_'cta_cta'] sm:grid-cols-[minmax(0,1fr)_minmax(0,min(420px,38%))] sm:grid-rows-[minmax(0,1fr)_repeat(5,auto)] sm:gap-x-[clamp(32px,6vw,96px)] sm:[grid-template-areas:'._arch'_'kicker_arch'_'name_arch'_'title_arch'_'lede_arch'_'cta_arch']"
    >
      {/* where, who, and whether he is free */}
      <p className="caps flex flex-col items-start gap-2.5 self-end pb-1 text-muted [grid-area:kicker] sm:mb-[clamp(20px,3vw,36px)] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3.5 sm:pb-0">
        <span>Casablanca, Morocco</span>
        <Dot className="hidden sm:block" />
        <span>
          <span lang="ar" dir="rtl" className="inline-block translate-y-[-1px] text-[24px] leading-none font-medium text-terra sm:text-[17px]">
            الدار البيضاء
          </span>
          <span className="sr-only">, Casablanca in Arabic</span>
        </span>
        {/* the status takes its own line until the column is wide enough for all three */}
        <Dot className="hidden lg:block" />
        <span className="inline-flex items-center gap-2 text-green sm:max-lg:basis-full">
          <Star size={11} />
          {site.status.label}
        </span>
      </p>

      <h1
        id="hero-title"
        className="mt-7 font-display text-[min(30vw,140px)] leading-[0.86] font-[380] tracking-[-0.045em] text-primary [grid-area:name] sm:-ms-[0.04em] sm:mt-0 sm:text-display-1"
      >
        <span className="sr-only">{site.name}</span>
        <span aria-hidden="true">
          {letters.map((letter, index) => (
            <span
              key={index}
              className={`inline-block animate-rise ${
                index === letters.length - 1 ? "pe-[0.04em] serif-italic text-terra-fill" : ""
              }`}
              style={{ animationDelay: `${120 + index * 55}ms` }}
            >
              {letter}
            </span>
          ))}
        </span>
      </h1>

      <p className="mt-3.5 max-w-[16ch] serif-italic text-[clamp(26px,3.3vw,42px)] leading-[1.12] font-[350] tracking-[-0.015em] text-primary [grid-area:title] sm:mt-[clamp(14px,2vw,22px)]">
        {after ? (
          <>
            {before} <span className="text-cobalt">&amp;</span> {after}
          </>
        ) : (
          site.title
        )}
      </p>

      <p className="mt-[clamp(16px,2.4vw,28px)] max-w-[44ch] text-[17px] leading-[1.6] text-pretty text-body [grid-area:lede]">
        I design and build software from Casablanca: product sites and platforms, tools for AI agents, a Bitcoin
        trading bot still in the works, and small interactive pieces for the lab. Online I go by {site.handle}.
      </p>

      <div className="mt-[clamp(22px,3vw,36px)] flex flex-wrap items-center gap-3 [grid-area:cta]">
        <JumpLink to="contact" className="btn btn-solid btn-lg">
          <Star size={13} className="text-terra-fill" />
          Write to me
        </JumpLink>
        <JumpLink to="work" className="btn btn-soft btn-lg">
          See the work
        </JumpLink>
      </div>

      <div className="relative w-full self-end justify-self-end [grid-area:arch] sm:max-w-[420px]">
        <HeroWindow
          piece={HERO.piece}
          href={HERO.href}
          caption={HERO.caption}
          label={HERO.label}
          nightLabel={HERO.nightLabel}
        >
          <DuskPoster />
        </HeroWindow>
        <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted tabular-nums sm:text-[13.5px] lg:absolute lg:end-0 lg:bottom-[3px] lg:mt-0">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-terra-fill" />
          <span>
            <span className="sr-only">In Casablanca it is </span>
            <LocalTime zone={false} />
            <span aria-hidden="true"> there now</span>
          </span>
        </p>
      </div>
    </section>
  );
}
