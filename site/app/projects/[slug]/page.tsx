// A project's own page (DESIGN.md §9, "Work list and project pages"):
//
//   ✦──────────────────────────────────────────────────────────────────
//   WORK / AEGILABS
//   AegiLabs                                         [Visit the live site ↗]
//   AI agents for workflow automation                [Source on GitHub ↗]
//
//   ─────────────── (ink)       Overview paragraphs …
//   KIND      AI agents
//   DATE      August 2026       ✦────────────────────────────────
//   TAGS      nextjs-16 …       Key features
//   VIEWS     1,204             ✦ Marketing Site …
//
//   CONTENTS                    ✦────────────────────────────────
//   01 Overview                 How it's built
//   02 Key features             01  FRAMEWORK   Next.js 16 …
//   03 How it's built
//
//   ✦──────────────────────────────────────────────────────────────────
//   MORE WORK                                                  All work →
//   PREVIOUS   Liquid Glass (big type)   …
//   NEXT       Laya …
//
// From 1024px the fiche and the contents sit in a sticky rail on the left
// and the write-up reads on the right. The contents entry for the part
// being read turns to italic cobalt; that is done with a CSS scroll-driven
// animation, so the page needs no client JavaScript (only the optional
// view count is a client component).

import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GitHub } from "@/components/icons";
import { Arrow, StarRule } from "@/components/ornament";
import { categoryLabel, projectYear } from "@/components/project-row";
import { ProjectViews } from "@/components/project-views";
import { PageHeader } from "@/components/section";
import { projects, site, type Project } from "@/content/site";
import { cn } from "@/lib/cn";
import { pad } from "@/lib/format";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

type ProjectLinks = { github?: string; live?: string };

function findProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = findProject(slug);
  if (!project) return {};
  const url = `/projects/${project.slug}/`;
  const description = `${project.name}: ${project.tagline}.`;
  return {
    title: project.name,
    description,
    alternates: { canonical: url },
    // Page-level openGraph replaces the layout's, so the shared bits are repeated.
    openGraph: {
      type: "article",
      url,
      siteName: site.name,
      title: `${project.name} • ${site.name}`,
      description,
      images: [{ url: site.ogImage, ...site.ogImageSize, alt: site.metaTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.name} • ${site.name}`,
      description,
      images: [{ url: site.ogImage, alt: site.metaTitle }],
    },
  };
}

/* ---------------------------------------------------------------------- */
/* the fiche                                                               */
/* ---------------------------------------------------------------------- */

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

/** "August 2026" → "2026-08" for <time dateTime>; anything else → undefined. */
function monthIso(value: string): string | undefined {
  const match = /^([a-z]+)\s+(\d{4})$/i.exec(value.trim());
  if (!match) return undefined;
  const month = MONTHS.indexOf(match[1].toLowerCase());
  return month < 0 ? undefined : `${match[2]}-${String(month + 1).padStart(2, "0")}`;
}

const squash = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Statuses that say nothing a visitor needs ("Verified" is on almost every project). */
const QUIET_STATUSES = new Set(["verified"]);

/** Words that all mean "still being built". */
const BUILDING = new Set(["inprogress", "wip", "intheworks", "comingsoon"]);

type FicheRow = { key: string; label: string; value: ReactNode };

/** Kind, date and status for the fiche, without saying the same thing twice:
    a project still being built shows "In the works" once, in green, and no
    kind ("wip" is not a kind of work). */
function ficheRows(project: Project): FicheRow[] {
  const rows: FicheRow[] = [];
  const date = project.date.trim();
  const status = project.status?.trim() ?? "";
  const building =
    project.category === "wip" || BUILDING.has(squash(date)) || BUILDING.has(squash(status));

  if (project.category !== "wip") {
    rows.push({ key: "kind", label: "Kind", value: categoryLabel(project.category) });
  }
  if (projectYear(date) !== null) {
    const iso = monthIso(date);
    rows.push({ key: "date", label: "Date", value: iso ? <time dateTime={iso}>{date}</time> : date });
  } else if (date && !BUILDING.has(squash(date))) {
    rows.push({ key: "date", label: "Date", value: date });
  }
  if (building) {
    rows.push({ key: "status", label: "Status", value: <span className="text-green">In the works</span> });
  } else if (status && !QUIET_STATUSES.has(squash(status))) {
    rows.push({ key: "status", label: "Status", value: status });
  }
  return rows;
}

/* ---------------------------------------------------------------------- */
/* contents                                                                */
/* ---------------------------------------------------------------------- */

type TocEntry = { id: string; label: string };

/** Timeline names have to be known up front for `timeline-scope`. */
const TOC_IDS = ["overview", "key-features", "architecture"] as const;
const timelineName = (id: string) => `--toc-${id}`;

/** Distance from the top of a <Part> to its heading: pt-16 + the 12px star rule + mt-6. */
const PART_HEAD_OFFSET = "100px";

// An entry is "current" from the moment its heading crosses a reading line 30%
// down the viewport until the next heading does (the first entry counts from
// page load). Each part's view timeline starts PART_HEAD_OFFSET above its
// heading, so the ranges are shifted by that much. Parts sit flush (padding,
// not margin), so one range ends exactly where the next begins. Each <li> runs
// an animation over its part's timeline that sets --toc-on: 1; the entry's
// styles answer to a style query, so they still ease in with ordinary
// transitions. The last entry fills forwards and stays lit to the end of the
// page. Browsers without scroll-driven animations get a plain list.
//
// The current entry takes the site's one hover signature, the italic turn
// (Fraunces italic, cobalt), and its numeral warms to terracotta.
//
// Anchor jumps glide: smooth scrolling is on while the pointer or focus is in
// the list, or while one of its targets is the URL fragment (a keyboard jump
// drops focus before the browser scrolls, but :target is already set). It is
// never on for the page as a whole, so page-to-page navigation still lands at
// the top instantly. Reduced motion keeps the instant jump.
const tocCss = `
@supports (animation-timeline: view()) {
  .ptoc-item {
    animation: ptoc-on linear none;
    animation-duration: auto;
  }
  .ptoc-item:last-child {
    animation-fill-mode: forwards;
  }
  @keyframes ptoc-on {
    from, to { --toc-on: 1; }
  }
  @container style(--toc-on: 1) {
    .ptoc-text {
      color: var(--cobalt);
      font-style: italic;
      font-variation-settings: "SOFT" 100, "WONK" 1;
    }
    .ptoc-num { color: var(--terra); }
  }
}
@media (prefers-reduced-motion: no-preference) {
  html:has(.ptoc:hover, .ptoc:focus-within, [data-toc-target]:target) {
    scroll-behavior: smooth;
  }
}
`;

function tocRange(first: boolean) {
  const end = `cover calc(100% - 30vh + ${PART_HEAD_OFFSET})`;
  return first ? `cover 0% ${end}` : `cover calc(70vh + ${PART_HEAD_OFFSET}) ${end}`;
}

function TableOfContents({ entries }: { entries: TocEntry[] }) {
  return (
    <nav aria-labelledby="ptoc-title" className="ptoc mt-12 hidden lg:block">
      <style>{tocCss}</style>
      <p id="ptoc-title" className="caps text-muted">
        Contents
      </p>
      <ol className="mt-3.5">
        {entries.map((entry, index) => (
          <li
            key={entry.id}
            className="ptoc-item"
            style={{ animationTimeline: timelineName(entry.id), animationRange: tocRange(index === 0) }}
          >
            <a
              href={`#${entry.id}`}
              className="group grid grid-cols-[30px_minmax(0,1fr)] items-baseline rounded-[4px] py-[5px] focus-ring"
            >
              <span
                aria-hidden="true"
                className="ptoc-num font-display text-[13px] text-muted tabular-nums transition-colors duration-300 ease-out [font-variant-numeric:oldstyle-nums_tabular-nums]"
              >
                {pad(index + 1)}
              </span>
              <span className="ptoc-text font-display text-[18px] leading-[1.3] text-secondary transition-colors duration-300 ease-out group-hover:text-primary">
                {entry.label}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ---------------------------------------------------------------------- */
/* the write-up                                                            */
/* ---------------------------------------------------------------------- */

/** One titled part of the write-up: a star rule, then the head in Fraunces
    with an italic turn. Padding (not margin) keeps the parts flush, so their
    scroll timelines hand over without a gap. */
function Part({ id, title, turn, children }: { id: string; title: string; turn?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="pt-16" style={{ viewTimeline: `${timelineName(id)} block` }}>
      <StarRule />
      <h2 id={id} data-toc-target="" className="mt-6 font-display text-title-2 font-[380] text-balance text-primary">
        {title}
        {turn ? (
          <>
            {" "}
            <em className="turn">{turn}</em>
          </>
        ) : null}
      </h2>
      <div className="mt-7">{children}</div>
    </section>
  );
}

function ExternalButton({
  href,
  solid,
  icon,
  children,
}: {
  href: string;
  solid: boolean;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("btn btn-lg", solid ? "btn-solid" : "btn-soft")}
    >
      {icon}
      {children}
      <Arrow external />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/* ---------------------------------------------------------------------- */
/* page                                                                    */
/* ---------------------------------------------------------------------- */

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const index = projects.findIndex((project) => project.slug === slug);
  if (index < 0) notFound();

  const project = projects[index];
  const previous = index > 0 ? projects[index - 1] : undefined;
  const next = index < projects.length - 1 ? projects[index + 1] : undefined;

  const links = project.links as ProjectLinks;
  const features = project.features.filter((feature) => feature.title.trim());
  const architecture = project.architecture
    .map((row) => ({ label: row.label.replace(/^\$\s*/, ""), value: row.value }))
    .filter((row) => row.label && row.value);
  const fiche = ficheRows(project);

  const toc: TocEntry[] = [
    { id: "overview", label: "Overview" },
    ...(features.length ? [{ id: "key-features", label: "Key features" }] : []),
    ...(architecture.length ? [{ id: "architecture", label: "How it's built" }] : []),
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.name,
    description: project.tagline,
    url: new URL(`/projects/${project.slug}/`, site.url).toString(),
    keywords: project.tags.join(", "),
    author: { "@type": "Person", name: site.name, url: site.url },
    ...(links.live ? { sameAs: links.live } : {}),
  };

  const actions =
    links.live || links.github ? (
      <div className="mt-7 flex flex-wrap gap-2.5">
        {links.live ? (
          <ExternalButton href={links.live} solid>
            Visit the live site
          </ExternalButton>
        ) : null}
        {links.github ? (
          <ExternalButton href={links.github} solid={!links.live} icon={<GitHub size={15} />}>
            Source on GitHub
          </ExternalButton>
        ) : null}
      </div>
    ) : undefined;

  return (
    <div style={{ timelineScope: TOC_IDS.map(timelineName).join(", ") }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />

      <article>
        <PageHeader
          trail={[{ label: "Work", href: "/projects/" }, { label: project.name }]}
          title={project.name}
          lede={
            <>
              <p>{project.tagline}</p>
              {actions}
            </>
          }
        />

        <div className="grid gap-y-12 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:gap-x-[clamp(48px,6vw,96px)] xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <aside
            aria-label={`${project.name} at a glance`}
            className="lg:sticky lg:top-[calc(var(--bar)+36px)] lg:self-start"
          >
            <dl className="fiche">
              {fiche.map((row) => (
                <div key={row.key}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
              {project.tags.length ? (
                <div>
                  <dt>Tags</dt>
                  <dd>
                    <ul aria-label="Tags" className="flex flex-wrap gap-1.5 pt-px">
                      {project.tags.map((tag) => (
                        <li key={tag} className="tag">
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ) : null}
              <ProjectViews slug={project.slug} />
            </dl>
            {toc.length > 1 ? <TableOfContents entries={toc} /> : null}
          </aside>

          <div className="min-w-0 text-[17px] leading-[1.65] text-body md:text-[18px]">
            <div
              id="overview"
              data-toc-target=""
              className="measure"
              style={{ viewTimeline: `${timelineName("overview")} block` }}
            >
              <h2 className="sr-only">Overview</h2>
              {project.body.map((paragraph, i) => (
                <p key={i} className={cn(i === 0 ? "text-primary" : "mt-5")}>
                  {paragraph}
                </p>
              ))}
            </div>

            {features.length ? (
              <Part id="key-features" title="Key" turn="features">
                <ul className="list-star measure">
                  {features.map((feature, i) => (
                    <li key={feature.title} className={cn(i > 0 && "mt-5")}>
                      <span className="block font-display text-[21px] leading-[1.25] font-[420] text-pretty text-primary">
                        {feature.title}
                      </span>
                      {feature.text.trim() ? <span className="mt-1.5 block">{feature.text}</span> : null}
                    </li>
                  ))}
                </ul>
              </Part>
            ) : null}

            {architecture.length ? (
              <Part id="architecture" title="How it's" turn="built">
                <dl className="rule-ink">
                  {architecture.map((row, i) => (
                    <div
                      key={row.label}
                      className="grid items-baseline gap-y-1 border-b border-line py-3.5 sm:grid-cols-[184px_minmax(0,1fr)] sm:gap-x-4"
                    >
                      <dt className="flex items-baseline">
                        <span aria-hidden="true" className="numeral w-[42px] shrink-0 text-[14px]">
                          {pad(i + 1)}
                        </span>
                        <span className="caps text-muted">{row.label}</span>
                      </dt>
                      <dd className="ps-[42px] text-[16px] leading-[1.5] text-primary sm:ps-0">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </Part>
            ) : null}
          </div>
        </div>
      </article>

      <nav aria-labelledby="more-work" className="mt-[clamp(80px,10vw,128px)]">
        <StarRule />
        <div className="mt-[22px] flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <p id="more-work" className="kicker">
            More work
          </p>
          <Link href="/projects/" className="link-arrow focus-ring rounded-[4px]">
            All work
            <Arrow />
          </Link>
        </div>
        <ul className="rule-ink mt-5">
          {previous ? <Neighbour project={previous} label="Previous" /> : null}
          {next ? <Neighbour project={next} label="Next" /> : null}
        </ul>
      </nav>
    </div>
  );
}

/** A big-type row to the previous or next project: the same band and
    italic turn as the work index, led by "Previous" / "Next". */
function Neighbour({ project, label }: { project: Project; label: string }) {
  return (
    <li className="border-b border-line">
      <Link
        href={`/projects/${project.slug}/`}
        data-row=""
        className={cn(
          "group row-rise grid items-baseline gap-y-1 px-1 pt-4 pb-4 text-primary focus-ring",
          "md:grid-cols-[120px_minmax(0,1fr)_minmax(0,300px)] md:gap-x-5 md:px-2 md:pt-[18px]",
        )}
      >
        <span className="caps text-terra md:-translate-y-[0.5em]">{label}</span>
        <span className="font-display text-title-1 text-pretty break-words transition-colors duration-300 ease-out group-hover:turn group-focus-visible:turn">
          {project.name}
        </span>
        <span className="text-[15px] leading-[1.45] text-muted md:-translate-y-[0.3em]">{project.tagline}</span>
      </Link>
    </li>
  );
}
