// Home intro, part 2: the intro paragraphs (site.intro) and the facts list
// (site.now, site.focus, the contact actions and site.socials).
//
//   I craft digital experiences … AegiLabs ↗ … experiments … lab.
//   ─────────────────────────────────────────────────────────────────────
//   Now      IT Administrator & Lead Developer at Extra Immobilien ↗   Since May 2026
//   ─────────────────────────────────────────────────────────────────────
//   Focus    AI agent orchestration · React · TypeScript · Figma · System design
//   ─────────────────────────────────────────────────────────────────────
//   Contact  Say hi ›   Book a call ›               GitHub  X  Instagram  Spotify
//   ─────────────────────────────────────────────────────────────────────
//
// On phones the right-hand column folds under the value: "since May 2026"
// joins the end of the Now line, and the socials get a line of their own.
//
// Intro segments (see content/site.ts):
//   { text }            plain copy in the body colour
//   { strong }          emphasis, in the foreground colour
//   { strong, href }    the same as an underlined link; ↗ when it leaves the site

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { ContactActions } from "@/components/home/intro-contact";
import { ArrowUpRight } from "@/components/icons";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { formatMonthYear } from "@/lib/format";

type Segment = (typeof site.intro)[number][number];

const isExternal = (href: string) => /^https?:\/\//.test(href);

const NEW_TAB = <span className="sr-only"> (opens in a new tab)</span>;

/** An inline link; pages of this site navigate client-side, other sites open in a new tab. */
function InlineLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
        <ArrowUpRight size={11} className="ms-0.5 inline align-[-0.5px] text-tertiary" />
        {NEW_TAB}
      </a>
    );
  }
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

function renderSegment(segment: Segment, key: number): ReactNode {
  if ("strong" in segment) {
    if ("href" in segment && segment.href) {
      return (
        <InlineLink key={key} href={segment.href} className="link rounded-[2px] whitespace-nowrap">
          {segment.strong}
        </InlineLink>
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

/**
 * A label + value row of the facts list. `aside` sits in a right-hand
 * column from sm up and folds under the value on phones (pass
 * `asideDesktopOnly` when the value already carries it inline there).
 */
function Fact({
  label,
  children,
  aside,
  asideDesktopOnly,
}: {
  label: string;
  children: ReactNode;
  aside?: ReactNode;
  asideDesktopOnly?: boolean;
}) {
  return (
    <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-4 gap-y-1 py-3 sm:grid-cols-[80px_minmax(0,1fr)_auto]">
      <dt className="text-[13px]/[21px] text-tertiary">{label}</dt>
      <dd className="text-[14px]/[21px] text-pretty text-primary">{children}</dd>
      {aside ? (
        <dd
          className={cn(
            "col-start-2 text-[13px]/[21px] text-tertiary tabular-nums sm:col-start-3 sm:text-end",
            asideDesktopOnly && "hidden sm:block",
          )}
        >
          {aside}
        </dd>
      ) : null}
    </div>
  );
}

export function Intro() {
  const { now, focus } = site;
  const since = formatMonthYear(now.since);

  return (
    <>
      <div className="mt-5 flex max-w-[600px] flex-col gap-4 text-[16px]/[1.65] text-pretty text-body sm:mt-6">
        {site.intro.map((paragraph, index) => (
          <p key={index}>{paragraph.map(renderSegment)}</p>
        ))}
      </div>

      <dl className="mt-6 divide-y divide-border border-y border-border sm:mt-8">
        <Fact label="Now" aside={`Since ${since}`} asideDesktopOnly>
          {now.role} <span className="text-tertiary">at</span>{" "}
          {/* Phones: "… Extra Immobilien ↗ · since May 2026", breaking only after the dot. */}
          <span className="whitespace-nowrap">
            <InlineLink href={now.href} className="link rounded-[2px]">
              {now.org}
            </InlineLink>
            <span aria-hidden="true" className="ms-1.5 text-tertiary opacity-60 sm:hidden">
              ·
            </span>
          </span>
          <span className="text-[13px] text-tertiary sm:hidden">
            {" "}
            <span className="sr-only">, </span>
            <span className="whitespace-nowrap">since {since}</span>
          </span>
        </Fact>
        <Fact label="Focus">
          {/* Lines break only after a dot, so a dot never starts a line. */}
          {focus.map((item, index) => {
            const last = index === focus.length - 1;
            return (
              <Fragment key={item}>
                <span className="whitespace-nowrap">
                  {item}
                  {last ? null : (
                    <>
                      <span className="sr-only">,</span>
                      <span aria-hidden="true" className="mx-2 text-tertiary opacity-60">
                        ·
                      </span>
                    </>
                  )}
                </span>
                {last ? null : <wbr />}
              </Fragment>
            );
          })}
        </Fact>
        <Fact
          label="Contact"
          aside={
            <ul aria-label="Elsewhere" className="-ms-2 flex flex-wrap items-center sm:ms-0 sm:-me-2 sm:justify-end">
              {site.socials.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="-my-1.5 block rounded-[6px] px-2 py-1.5 text-secondary underline decoration-transparent underline-offset-[3px] transition-colors duration-150 ease-out hover:text-primary hover:decoration-current focus-ring"
                  >
                    {social.name}
                    {NEW_TAB}
                  </a>
                </li>
              ))}
            </ul>
          }
        >
          <ContactActions />
        </Fact>
      </dl>
    </>
  );
}
