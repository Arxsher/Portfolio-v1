// Home, section One · About (DESIGN.md → Home → About): an identity sheet
// (the fiche) beside a short letter set from site.intro, closed by a line
// in Zakaria's own words from content/about.json. Two sidenotes from the
// same page sit under the fiche on wide screens and after the letter, as
// a starred list, on phones.
//
//   ✦──────────────────────────────────────────────────────────────
//   ONE · ABOUT
//   A builder from Casablanca                         The short version …
//
//   NAME      Zakaria                 Hey, I'm Zakaria. I'm a designer …
//             goes by arsher · @Arxsher
//   PRACTICE  …                       By day I'm IT Administrator & Lead
//   BY DAY    …                       Developer at Extra Immobilien …
//   BASED IN  Casablanca, Morocco
//   STATUS    ✦ Available for work    “Software should feel physically …”
//
// Intro segments (content/site.ts):
//   { text }               running copy
//   { strong }             emphasis, in ink
//   { strong, href }       a link-strong (terracotta underline)
//   { chip, icon, href }   an outlined chip (GitHub mark for github, a star otherwise)

import Link from "next/link";
import type { ReactNode } from "react";
import { GitHub } from "@/components/icons";
import { Star } from "@/components/ornament";
import { Section } from "@/components/section";
import about from "@/content/about.json";
import { site } from "@/content/site";

type Segment = (typeof site.intro)[number][number];

const isExternal = (href: string) => /^https?:\/\//.test(href);

const NEW_TAB = <span className="sr-only"> (opens in a new tab)</span>;

function segment(part: Segment, key: number): ReactNode {
  if ("chip" in part) {
    const content = (
      <>
        {part.icon === "github" ? <GitHub size={13} /> : <Star size={11} />}
        {part.chip}
      </>
    );
    const className = "chip focus-ring";
    if (isExternal(part.href)) {
      return (
        <a key={key} className={className} href={part.href} target="_blank" rel="noopener noreferrer">
          {content}
          {NEW_TAB}
        </a>
      );
    }
    if (part.href.startsWith("/")) {
      return (
        <Link key={key} className={className} href={part.href}>
          {content}
        </Link>
      );
    }
    return (
      <a key={key} className={className} href={part.href}>
        {content}
      </a>
    );
  }
  if ("strong" in part) {
    if ("href" in part && part.href) {
      const external = isExternal(part.href);
      return (
        <a
          key={key}
          className="link-strong rounded-[2px] focus-ring"
          href={part.href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {part.strong}
          {external ? NEW_TAB : null}
        </a>
      );
    }
    return (
      <strong key={key} className="font-semibold text-primary">
        {part.strong}
      </strong>
    );
  }
  return <span key={key}>{part.text}</span>;
}

// "Software should feel physically grounded and performant, with zero room
// for unnecessary jank.", lifted from the about page as written.
function groundedLine(): string | null {
  const source = about.paragraphs.find((paragraph) => paragraph.includes("physically grounded"));
  const match = source?.match(/software should feel[^.]*/i);
  if (!match) return null;
  const line = match[0].replace(/ or technical debt$/, "");
  return `${line.charAt(0).toUpperCase()}${line.slice(1)}.`;
}

// The day job, from the intro copy ("… IT Administrator & Lead Developer at Extra Immobilien").
const role = { title: "IT Administrator & Lead Developer", company: "Extra Immobilien" };
const github = site.socials.find((social) => social.name === "GitHub");

// Two notes in his own words (content/about.json).
const sidenotes = [
  { lead: "Resident Tinkerer.", text: "Autonomous, iterative and technically rigorous: the way I like to work." },
  { lead: "In the trenches:", text: "Arch Linux, Hackintosh kernels and BIOS tuning, pushing hardware to its limit." },
];

export function Intro() {
  const quote = groundedLine();

  return (
    <Section
      id="about"
      label="About"
      numeral="One"
      title="A builder from"
      turn="Casablanca"
      note="The short version: who I am, what I do by day, and how I think software should feel."
    >
      <div className="grid gap-x-[clamp(32px,6vw,96px)] gap-y-10 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:[grid-template-areas:'fiche_letter'_'notes_letter'] lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <dl className="fiche self-start md:[grid-area:fiche]">
          <div>
            <dt>Name</dt>
            <dd>
              {site.name}
              <span className="block text-[13.5px] text-muted">
                goes by {site.handle}
                {github ? (
                  <>
                    {" · "}
                    <a href={github.href} target="_blank" rel="noopener noreferrer" className="link rounded-[2px] text-muted focus-ring">
                      @{github.handle}
                      {NEW_TAB}
                    </a>
                  </>
                ) : null}
              </span>
            </dd>
          </div>
          <div>
            <dt>Practice</dt>
            <dd>{site.title}</dd>
          </div>
          <div>
            <dt>By day</dt>
            <dd>
              {role.title}
              <span className="block text-[13.5px] text-muted">{role.company}</span>
            </dd>
          </div>
          <div>
            <dt>Based in</dt>
            <dd>
              Casablanca, Morocco
              <span className="block text-[13.5px] text-muted">On the Atlantic coast</span>
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <span className="inline-flex items-center gap-2 text-green">
                <Star size={12} />
                {site.status.label}
              </span>
            </dd>
          </div>
        </dl>

        <div className="min-w-0 md:[grid-area:letter]">
          <div className="flex flex-col gap-[1.1em] text-lede tracking-[-0.005em] text-pretty text-body">
            {site.intro.map((paragraph, index) => (
              <p
                key={index}
                className={
                  index === 0
                    ? "first-letter:float-left first-letter:mt-[0.06em] first-letter:me-[0.12em] first-letter:-ms-[0.02em] first-letter:font-display first-letter:text-[4.1em] first-letter:leading-[0.8] first-letter:font-normal first-letter:text-terra-fill first-letter:italic first-letter:[font-variation-settings:'SOFT'_100,'WONK'_1]"
                    : undefined
                }
              >
                {paragraph.map(segment)}
              </p>
            ))}
          </div>

          {quote ? (
            <figure className="mt-7 border-t border-line pt-[26px]">
              <blockquote>
                <p className="serif-italic text-title-2 font-[350] text-balance text-primary">“{quote}”</p>
              </blockquote>
              <figcaption className="mt-3 text-[14px] text-muted">Zakaria, on how software should feel</figcaption>
            </figure>
          ) : null}
        </div>

        <aside aria-label="Sidenotes" className="md:[grid-area:notes] md:self-start">
          <ul className="list-star flex flex-col gap-3 text-[15px] leading-[1.5] text-body md:gap-5 md:border-s md:border-line md:ps-5 md:[&>li]:ps-0 md:[&>li]:before:hidden">
            {sidenotes.map((note) => (
              <li key={note.lead}>
                <span className="serif-italic text-[17px] text-primary md:block md:text-[19px]">{note.lead}</span>{" "}
                <span className="md:text-[14.5px] md:text-muted">{note.text}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </Section>
  );
}
