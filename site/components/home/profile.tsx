// Home, the contact postcard (DESIGN.md → Home → Contact postcard). This
// file used to hold the avatar + name block; that block is gone (the hero
// carries the name, the About fiche the facts) and the ways to get in
// touch live here instead, as the back of a postcard:
//
//   ┌─/ / / / airmail / / / /───────────┬───────────────────────────────┐
//   │ Write to me.                      │           ((postmark))  [stamp]│
//   │ A product to build, a role …      │                                │
//   │ [✦ Say hi]  [▦ Book a call]       │ TO        Zakaria (arsher), …  │
//   │ - - - - - - - - - - - - - - - -   │ GITHUB    Arxsher            ↗ │
//   │ nzakaria644@gmail.com  [Copy]     │ X         @Arxsher           ↗ │
//   │                                   │ …                              │
//   │ P.S. In the lab there is a seal … │                                │
//   └───────────────────────────────────┴───────────────────────────────┘
//
// Say hi and Book a call open the contact sheet of the Index
// (openCommand("say-hi" | "book-call")). The postmark carries today's date
// and Casablanca's time, live. Section id "contact" (the hero's "Write to
// me" scrolls here); the heading is the postcard's own "Write to me.".

import Link from "next/link";
import type { ComponentType } from "react";
import { ContactButton, CopyAddress, Postmark } from "@/components/home/postcard-bits";
import { Calendar, SocialIcons, type IconProps } from "@/components/icons";
import { Arrow, Star } from "@/components/ornament";
import { site } from "@/content/site";
import { crossPoints, starPoints } from "@/lib/zellige";

const icons: Record<string, ComponentType<IconProps>> = SocialIcons;

// The airmail edge along the top of the card.
const AIRMAIL =
  "repeating-linear-gradient(-45deg, var(--z-blue) 0 12px, transparent 12px 20px, var(--terra-fill) 20px 32px, transparent 32px 40px)";

// Stamp perforations: a row of punched holes all round the edge.
const PERFORATION = {
  WebkitMask:
    "radial-gradient(circle at center, transparent 3.4px, #000 3.9px) -5px -5px / 10px 10px, linear-gradient(#000, #000) center / calc(100% - 10px) calc(100% - 10px) no-repeat",
  mask: "radial-gradient(circle at center, transparent 3.4px, #000 3.9px) -5px -5px / 10px 10px, linear-gradient(#000, #000) center / calc(100% - 10px) calc(100% - 10px) no-repeat",
};

/** The stamp's picture: a small zellige panel, stars and crosses. */
function StampArt() {
  const pitch = 30;
  const tiles: Array<{ points: string; tone: string }> = [];
  for (let row = 0; row < 5; row++)
    for (let col = 0; col < 4; col++)
      tiles.push({
        points: crossPoints(col * pitch, row * pitch, pitch),
        tone: (col + row) % 2 ? "fill-z-terra" : "fill-z-cream",
      });
  for (let row = 0; row <= 5; row++)
    for (let col = 0; col <= 4; col++)
      tiles.push({
        points: starPoints(col * pitch, row * pitch, pitch / 2),
        tone: (col + row) % 3 === 0 ? "fill-z-green" : "fill-z-blue",
      });
  return (
    <svg
      viewBox="6 6 104 136"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className="absolute inset-0 size-full"
    >
      {tiles.map((tile, index) => (
        <polygon key={index} points={tile.points} className={`${tile.tone} stroke-z-cream`} strokeWidth="1.2" />
      ))}
      <rect x="6" y="104" width="104" height="38" fill="#1a1d3a" opacity="0.72" />
    </svg>
  );
}

export function Postcard() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      // land on the card itself, not on the gap above it
      className="section scroll-mt-[calc(var(--bar)+28px-var(--section-gap))]"
    >
      <div className="group/card paper relative grid overflow-hidden md:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 opacity-90" style={{ backgroundImage: AIRMAIL }} />

        {/* the message side */}
        <div className="flex flex-col border-b border-dashed border-line-firm px-[clamp(22px,4vw,56px)] pt-[clamp(34px,4.4vw,60px)] pb-[clamp(28px,4vw,56px)] md:border-e md:border-b-0 md:border-solid md:border-line">
          <h2
            id="contact-title"
            className="serif-italic text-[clamp(40px,5vw,64px)] leading-[0.98] font-[350] tracking-[-0.03em] text-primary"
          >
            Write to me.
          </h2>
          <p className="mt-4 max-w-[40ch] text-[16.5px] leading-[1.6] text-body">
            A product to build, a role to fill, an idea that needs a developer who also designs: send a note, or set
            up a call.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            <ContactButton view="say-hi" className="btn btn-solid">
              <Star size={13} className="text-terra-fill" />
              Say hi
            </ContactButton>
            <ContactButton view="book-call" className="btn btn-soft">
              <Calendar size={15} />
              Book a call
            </ContactButton>
          </div>
          <p className="mt-[26px] flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-dashed border-line-firm pt-[18px] text-[15px] text-primary">
            <a href={`mailto:${site.email}`} className="link rounded-[2px] font-medium focus-ring">
              {site.email}
            </a>
            <CopyAddress email={site.email} />
          </p>
          <p className="mt-auto pt-7 serif-italic text-[17px] leading-[1.45] text-muted">
            P.S. In the lab there is{" "}
            <Link
              href="/lab/seal/"
              className="rounded-[2px] text-primary underline decoration-terra-fill decoration-1 underline-offset-[3px] transition-colors duration-200 hover:text-terra focus-ring"
            >
              a wax seal
            </Link>{" "}
            you can press onto a letter, then break.
          </p>
        </div>

        {/* the address side */}
        <div className="relative px-[clamp(22px,4vw,56px)] pt-7 pb-[clamp(28px,4vw,56px)] md:pt-[clamp(34px,4.4vw,60px)]">
          <div className="relative flex h-[132px] justify-end md:h-[150px]">
            <Postmark className="pointer-events-none absolute end-[74px] top-3.5 z-10 h-32 w-[196px] -rotate-9 opacity-90 dark:opacity-95 md:end-16 md:top-[30px]" />
            <div
              aria-hidden="true"
              className="relative h-32 w-[104px] rotate-3 bg-z-cream p-2 transition-[rotate] duration-500 ease-spring group-hover/card:-rotate-1 motion-reduce:transition-none"
              style={PERFORATION}
            >
              <div className="relative grid h-full content-end overflow-hidden bg-z-blue p-1.5">
                <StampArt />
                <span className="relative text-[8.5px] leading-[1.2] font-bold tracking-[0.16em] text-[#fbf3e2] uppercase [text-shadow:0_1px_0_rgb(0_0_0/0.25)]">
                  Casablanca
                </span>
              </div>
            </div>
          </div>

          <ul className="mt-7">
            <li className="flex min-h-[46px] items-baseline gap-3 border-b border-line-firm pt-3">
              <span className="caps w-[76px] flex-none text-muted sm:w-[84px]">To</span>
              <span className="min-w-0 flex-1 serif-italic text-[17px] text-primary sm:text-[19px]">
                {site.name} ({site.handle}), Casablanca
              </span>
            </li>
            {site.socials.map((social) => {
              const Icon = icons[social.name];
              return (
                <li key={social.name} className="flex min-h-[46px] items-baseline gap-3 border-b border-line-firm pt-3">
                  <span className="caps w-[76px] flex-none text-muted sm:w-[84px]">{social.name}</span>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/link -my-1 flex min-w-0 flex-1 items-baseline justify-between gap-3 rounded-[4px] py-1 serif-italic text-[17px] text-primary transition-colors sm:text-[19px] duration-200 hover:text-cobalt focus-ring"
                  >
                    <span className="inline-flex min-w-0 items-center gap-2.5">
                      {Icon ? <Icon size={14} className="translate-y-0.5 text-muted" /> : null}
                      <span className="truncate">{social.handle}</span>
                    </span>
                    <Arrow external className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                    <span className="sr-only"> on {social.name} (opens in a new tab)</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
