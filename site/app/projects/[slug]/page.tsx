// A project's own page, laid out like a writing post: meta line, title and
// one-line summary, then the write-up (overview paragraphs, key features,
// architecture), the tags, and links to the previous / next project.
// On wide screens a table of contents sits fixed on the left; the entry for
// the part being read is highlighted by a CSS scroll-driven animation, so the
// page needs no client JavaScript.

import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "@/components/icons";
import { projects, site, type Project } from "@/content/site";
import { cn } from "@/lib/cn";

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
      images: [{ url: site.ogImage, width: 1200, height: 675, alt: site.metaTitle }],
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
/* meta line                                                               */
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

/** Words that mean the same thing in the meta line ("In progress", "wip"). */
const SAME_AS: Record<string, string> = { wip: "inprogress" };

function metaItems(project: Project): string[] {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const value of [project.date, project.category, project.status]) {
    const text = value?.trim();
    if (!text) continue;
    const key = text.toLowerCase().replace(/[^a-z0-9]/g, "");
    const canonical = SAME_AS[key] ?? key;
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    items.push(text);
  }
  return items;
}

/* ---------------------------------------------------------------------- */
/* table of contents                                                       */
/* ---------------------------------------------------------------------- */

type TocEntry = { id: string; label: string };

/** Timeline names have to be known up front for `timeline-scope`. */
const TOC_IDS = ["overview", "key-features", "architecture"] as const;
const timelineName = (id: string) => `--toc-${id}`;

// An entry is "current" while its part of the page crosses a reading line
// 35% down the viewport. The first part counts from the moment the page
// loads. Each <li> runs an animation over its part's view timeline that sets
// --toc-on: 1; the link styles answer to a style query so they still ease in
// with ordinary transitions. Browsers without scroll-driven animations get a
// plain list.
const tocCss = `
@supports (animation-timeline: view()) {
  .ptoc-item {
    animation: ptoc-on linear none;
    animation-duration: auto;
  }
  @keyframes ptoc-on {
    from, to { --toc-on: 1; }
  }
  @container style(--toc-on: 1) {
    .ptoc-link { color: var(--foreground); font-weight: 500; }
    .ptoc-line { scale: 1 1; opacity: 1; }
    .ptoc-text { translate: 12px 0; }
  }
}
`;

function tocRange(first: boolean) {
  return first ? "cover 0% cover calc(100% - 35vh)" : "cover 65vh cover calc(100% - 35vh)";
}

function TableOfContents({ entries }: { entries: TocEntry[] }) {
  return (
    <nav aria-label="Table of contents" className="fixed top-24 left-8 hidden w-[210px] xl:block">
      <style>{tocCss}</style>
      <p className="text-[14px] text-secondary">Table of Contents</p>
      <ul className="mt-8">
        {entries.map((entry, index) => (
          <li
            key={entry.id}
            className="ptoc-item"
            style={{ animationTimeline: timelineName(entry.id), animationRange: tocRange(index === 0) }}
          >
            {index > 0 ? (
              <span aria-hidden="true" className="block">
                <span className="flex h-[9px] items-center">
                  <span className="h-px w-3 bg-secondary/15" />
                </span>
                <span className="flex h-[9px] items-center">
                  <span className="h-px w-3 bg-secondary/15" />
                </span>
              </span>
            ) : null}
            <a
              href={`#${entry.id}`}
              className="ptoc-link group relative flex h-[9px] items-center gap-2.5 text-[13px] leading-none text-secondary transition-colors duration-200 ease-out before:absolute before:inset-x-0 before:-inset-y-[9px] before:content-[''] hover:text-primary"
            >
              <span className="flex w-8 shrink-0">
                <span className="ptoc-line h-px w-full origin-left scale-x-[0.625] bg-current opacity-25 transition-[scale,opacity] duration-300 ease-swap group-hover:scale-x-[0.85]" />
              </span>
              <span className="ptoc-text truncate transition-[translate] duration-300 ease-swap motion-reduce:transition-none">
                {entry.label}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ---------------------------------------------------------------------- */
/* prose pieces                                                            */
/* ---------------------------------------------------------------------- */

/** The quiet dashed divider between parts of a post. */
function SectionRule() {
  return (
    <div aria-hidden="true" className="flex justify-center gap-1">
      {[0, 1, 2, 3, 4, 5].map((dash) => (
        <span key={dash} className="h-0.5 w-4 rounded-full bg-secondary/12" />
      ))}
    </div>
  );
}

/** One titled part of the write-up. Padding (not margin) keeps the parts
    flush, so their scroll timelines hand over without a gap. */
function Part({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="pt-14" style={{ viewTimeline: `${timelineName(id)} block` }}>
      <SectionRule />
      <h2 id={id} className="mt-14 scroll-mt-24 font-medium text-primary">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1">
      {children}
      <ArrowUpRight size={13} className="text-tertiary" />
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
  const meta = metaItems(project);
  const dateIso = monthIso(project.date);

  const toc: TocEntry[] = [
    { id: "overview", label: "Overview" },
    ...(features.length ? [{ id: "key-features", label: "Key features" }] : []),
    ...(architecture.length ? [{ id: "architecture", label: "Architecture" }] : []),
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

  return (
    <div style={{ timelineScope: TOC_IDS.map(timelineName).join(", ") }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />

      {toc.length > 1 ? <TableOfContents entries={toc} /> : null}

      <header className="mt-16">
        <p className="flex flex-wrap items-center gap-x-1.5 text-[13px] text-tertiary tabular-nums">
          {meta.map((item, i) => (
            <span key={item} className="contents">
              {i > 0 ? (
                <span aria-hidden="true" className="opacity-60">
                  ·
                </span>
              ) : null}
              {i === 0 && dateIso ? <time dateTime={dateIso}>{item}</time> : <span>{item}</span>}
            </span>
          ))}
        </p>
        <h1 className="mt-3 text-[22px] leading-[1.3] font-medium tracking-[-0.015em] text-balance text-primary">
          {project.name}
        </h1>
        <p className="mt-3 text-[16px] leading-[1.5] text-pretty">{project.tagline}</p>
        {links.live || links.github ? (
          <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[15px]">
            {links.live ? <ExternalLink href={links.live}>Live site</ExternalLink> : null}
            {links.github ? <ExternalLink href={links.github}>GitHub</ExternalLink> : null}
          </p>
        ) : null}
      </header>

      <article className="mt-14 text-[16px] leading-[1.6]">
        <div id="overview" className="scroll-mt-24" style={{ viewTimeline: `${timelineName("overview")} block` }}>
          {project.body.map((paragraph, i) => (
            <p key={i} className={cn(i > 0 && "mt-5")}>
              {paragraph}
            </p>
          ))}
        </div>

        {features.length ? (
          <Part id="key-features" title="Key features">
            <ul className="list-['–__'] ps-5 marker:text-tertiary">
              {features.map((feature, i) => (
                <li key={feature.title} className={cn(i > 0 && "mt-2")}>
                  {feature.text.trim() ? (
                    <>
                      <strong className="font-medium text-primary">{feature.title}</strong>: {feature.text}
                    </>
                  ) : (
                    feature.title
                  )}
                </li>
              ))}
            </ul>
          </Part>
        ) : null}

        {architecture.length ? (
          <Part id="architecture" title="Architecture">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-start text-[15px]">
                <tbody>
                  {architecture.map((row, i) => {
                    const last = i === architecture.length - 1;
                    const cell = cn("py-[0.6em] align-top", !last && "border-b border-border");
                    return (
                      <tr key={row.label}>
                        <th scope="row" className={cn(cell, "pe-[0.75em] text-start font-normal whitespace-nowrap text-primary")}>
                          {row.label}
                        </th>
                        <td className={cn(cell, "ps-[0.75em]")}>{row.value}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Part>
        ) : null}

        {project.tags.length ? (
          <ul aria-label="Tags" className="mt-10 flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <li key={tag} className="rounded-[8px] bg-control px-2 py-0.5 text-[13px] leading-[1.5] text-secondary">
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </article>

      <nav
        aria-label="More projects"
        className="mt-20 flex items-start justify-between gap-6 border-t border-border pt-10 sm:mt-24"
      >
        {previous ? <Neighbour project={previous} label="Previous" /> : <span />}
        {next ? <Neighbour project={next} label="Next" align="end" /> : <span />}
      </nav>
    </div>
  );
}

function Neighbour({ project, label, align }: { project: Project; label: string; align?: "end" }) {
  return (
    <Link
      href={`/projects/${project.slug}/`}
      className={cn(
        "group -m-3 block max-w-[48%] rounded-xl p-3 transition-[background-color] duration-150 ease-out hover:bg-tint",
        align === "end" && "text-end",
      )}
    >
      <span className="block text-[13px] text-tertiary">{label}</span>
      <span className="mt-1 line-clamp-2 block font-medium text-secondary transition-colors duration-150 ease-out group-hover:text-primary">
        {project.name}
      </span>
    </Link>
  );
}
