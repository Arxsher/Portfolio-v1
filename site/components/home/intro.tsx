// Home hero, part 3: the intro paragraphs from site.intro and the row of
// actions under them (Say hi, Book a call, social links).
//
// Intro segments (see content/site.ts):
//   { text }                 plain copy in the secondary colour
//   { strong }               emphasis, in the foreground colour
//   { strong, href }         the same, as a link (underline firms up on hover)
//   { chip, icon, href }     a small inline pill with an icon (github | sparkle)

import type { ComponentType, ReactNode } from "react";
import { CommandButton } from "@/components/home/hero-client";
import { Calendar, GitHub, Mail, SocialIcons, Sparkle, type IconProps } from "@/components/icons";
import { site } from "@/content/site";

type Segment = (typeof site.intro)[number][number];

const chipIcons: Record<string, ComponentType<IconProps>> = {
  github: GitHub,
  sparkle: Sparkle,
};

const isExternal = (href: string) => /^https?:\/\//.test(href);

/** target/rel for links that leave the site. */
function linkProps(href: string) {
  return isExternal(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};
}

const chipClass =
  "mx-0.5 inline-flex -translate-y-px cursor-pointer items-center gap-1.5 rounded-[8px] bg-control px-1.5 py-0.5 align-middle text-[15px] leading-[1.3] text-primary transition-[background-color,scale] duration-150 ease-out hover:bg-control-hover active:scale-[0.96]";

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
      <section className="mt-6 max-w-[600px] space-y-4 text-[16px] leading-[1.65] text-pretty text-secondary">
        {site.intro.map((paragraph, index) => (
          <p key={index}>{paragraph.map(renderSegment)}</p>
        ))}
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <CommandButton view="say-hi" className="btn btn-solid">
          <Mail size={14} />
          Say hi
        </CommandButton>
        <CommandButton view="book-call" className="btn btn-soft">
          <Calendar size={14} />
          Book a call
        </CommandButton>
        {/* Four socials don't fit next to the buttons on a 390px phone at
            34px each, so they tighten to 30px below `sm`. Narrower than
            that (388px and down) they wrap onto their own line, pulled
            7px left so the first glyph lines up with the text. */}
        <span className="flex items-center max-[389px]:-ms-[7px] max-[389px]:basis-full sm:ms-1">
          {site.socials.map((social) => {
            const Icon = SocialIcons[social.name];
            return (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                className="btn btn-icon max-sm:w-[30px]!"
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
