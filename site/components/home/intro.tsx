// Home hero, part 3: the intro paragraphs from site.intro and the row of
// actions under them (Say hi, Book a call, social links).
//
// Intro segments (see content/site.ts):
//   { text }                 plain copy in the secondary colour
//   { strong }               emphasis, in the foreground colour
//   { strong, href }         the same, as a link (underline firms up on hover)
//   { chip, icon, href }     a small inline pill with an icon (github | sparkle | folder)

import type { ComponentType, ReactNode } from "react";
import { CommandButton } from "@/components/home/hero-client";
import { Calendar, Folder, GitHub, Mail, SocialIcons, Sparkle, type IconProps } from "@/components/icons";
import { site } from "@/content/site";

/**
 * A heavier X mark for the social row. The shared icon is the fine brand
 * outline, which reads small and light next to the solid GitHub mark; this
 * one is a solid stroke-drawn X on the same 16px grid (about 13 x 13.5px
 * of ink, the optical size of the reference's 20px glyph), so the four
 * glyphs carry the same weight.
 */
function XMark({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className ? `shrink-0 ${className}` : "shrink-0"}
    >
      <path
        d="M2.6 2h2.1l8.6 12h-2.1z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path d="M13.75 2.05 2.25 13.95" stroke="currentColor" strokeWidth={1.55} strokeLinecap="round" />
    </svg>
  );
}

const socialIcons: Record<string, ComponentType<IconProps>> = { ...SocialIcons, X: XMark };

type Segment = (typeof site.intro)[number][number];

const chipIcons: Record<string, ComponentType<IconProps>> = {
  github: GitHub,
  sparkle: Sparkle,
  folder: Folder,
};

const isExternal = (href: string) => /^https?:\/\//.test(href);

/** target/rel for links that leave the site. */
function linkProps(href: string) {
  return isExternal(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};
}

// The focus ring hugs the chip (1px off its edge) instead of the global 2px,
// so a chip at the start of a line stays within the text column.
const chipClass =
  "mx-0.5 inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] bg-well px-1.5 py-0.5 align-middle text-[15px]/[1.3] text-primary [translate:0_-1px] transition-[scale,background-color] duration-150 ease-out hover:bg-well-hover active:scale-[0.96] focus-visible:outline-offset-1";

function renderSegment(segment: Segment, key: number): ReactNode {
  if ("chip" in segment) {
    const Icon = chipIcons[segment.icon];
    return (
      <a key={key} href={segment.href} {...linkProps(segment.href)} className={chipClass}>
        {Icon ? <Icon size={13} /> : null}
        {segment.chip}
      </a>
    );
  }
  if ("strong" in segment) {
    if ("href" in segment && segment.href) {
      return (
        <a key={key} href={segment.href} {...linkProps(segment.href)} className="link rounded-[2px]">
          {segment.strong}
        </a>
      );
    }
    return (
      <span key={key} className="text-primary">
        {segment.strong}
      </span>
    );
  }
  return segment.text;
}

export function Intro() {
  return (
    <>
      <section className="mt-6 flex max-w-[600px] flex-col gap-4 text-[16px]/[1.65] text-pretty text-secondary">
        {site.intro.map((paragraph, index) => (
          <p key={index}>{paragraph.map(renderSegment)}</p>
        ))}
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-2">
        {/* The shared 16-grid glyphs are drawn a touch larger than the
            reference's, so they render at 13px inside a 14px slot (the
            0.5px margins keep the button widths at 87 / 117px). */}
        <CommandButton view="say-hi" className="btn btn-solid">
          <Mail size={13} className="mx-[0.5px]" />
          Say hi
        </CommandButton>
        <CommandButton view="book-call" className="btn btn-soft">
          <Calendar size={13} className="mx-[0.5px]" />
          Book a call
        </CommandButton>
        {/* Four 34px socials don't fit next to the buttons on a 390px phone,
            so between 389px and `sm` they tighten to 30px (30 x 40 on touch
            screens) to stay on one line. Narrower than that (388px and
            down) they wrap onto their own line at full size (34px, or 40px
            on touch, as .btn-icon sets), pulled left by the glyph's inset
            so the first one lines up with the text above. */}
        <span className="flex items-center max-[389px]:-ms-[9px] max-[389px]:basis-full max-[389px]:pointer-coarse:-ms-3 sm:ms-1">
          {site.socials.map((social) => {
            const Icon = socialIcons[social.name];
            if (!Icon) return null;
            return (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                className="btn btn-icon min-[389px]:max-sm:w-[30px]!"
              >
                <Icon />
              </a>
            );
          })}
        </span>
      </div>
    </>
  );
}
