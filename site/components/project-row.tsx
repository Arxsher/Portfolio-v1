// The work index (DESIGN.md §7, "Rows and indexes"): a big-type numbered
// list used on the home page (work section) and on /projects/.
//
//   01   AegiLabs              AI agents for workflow automation   AI AGENTS   2026
//   ─────────────────────────────────────────────────────────────────────────────
//   02   Liquid Glass          A liquid glass website, coming soon IN THE WORKS NOW
//
// An ink rule opens the list and a hairline closes each row. On hover or
// focus a sand band rises behind the row (`row-rise`) and the name turns
// to italic cobalt (`turn`). That is the whole interaction: no icon tiles,
// no arrows, nothing else fades. Each row link carries `data-row`, so the
// j / k shortcuts (lib/shortcuts.ts) walk it.
//
// Columns: phones show number, name and year, with the tagline and the
// category wrapping under the name; tablets add the category column;
// desktops lay everything on one line.

import Link from "next/link";
import { pad } from "@/lib/format";
import { cn } from "@/lib/cn";

export type ProjectSummary = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  date: string;
};

/** Human labels for the categories in content/projects.json. */
const CATEGORY: Record<string, string> = {
  "ai-agents": "AI agents",
  wip: "In the works",
  freelance: "Freelance",
  social: "Social",
  platform: "Platform",
  fullstack: "Full-stack",
  realtime: "Real-time",
  experimental: "Experimental",
  creative: "Creative",
};

/** "ai-agents" → "AI agents"; an unknown slug is tidied ("game-dev" → "Game dev"). */
export function categoryLabel(category: string): string {
  const known = CATEGORY[category];
  if (known) return known;
  const words = category.replace(/[-_]+/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : category;
}

/** The year in a project's date ("August 2026" → 2026), or null while it is still being built. */
export function projectYear(date: string): number | null {
  const match = /\b(\d{4})\b/.exec(date);
  return match ? Number(match[1]) : null;
}

export function ProjectList({
  projects,
  className,
}: {
  projects: ReadonlyArray<ProjectSummary>;
  className?: string;
}) {
  return (
    <ol className={cn("rule-ink", className)}>
      {projects.map((project, index) => (
        <ProjectRow key={project.slug} project={project} number={index + 1} />
      ))}
    </ol>
  );
}

export function ProjectRow({ project, number }: { project: ProjectSummary; number: number }) {
  const year = projectYear(project.date);
  return (
    <li className="border-b border-line">
      <Link
        href={`/projects/${project.slug}/`}
        data-row=""
        className={cn(
          "group row-rise grid items-baseline text-primary focus-ring",
          // phones: number · name · year, then tagline and category underneath
          "grid-cols-[30px_minmax(0,1fr)_auto] gap-x-3 gap-y-1 px-1 pt-4 pb-3.5",
          // tablets: the category gets its own column
          "md:grid-cols-[48px_minmax(0,1fr)_112px_64px] md:gap-x-5 md:px-2 md:pt-[18px] md:pb-4",
          // desktops: one line per project
          "lg:grid-cols-[64px_minmax(0,1fr)_minmax(0,360px)_128px_72px]",
        )}
      >
        <span aria-hidden="true" className="numeral col-[1/2] row-[1] text-[13px] md:-translate-y-[0.2em] md:text-[15px]">
          {pad(number)}
        </span>
        <span
          className={cn(
            "col-[2/3] row-[1] font-display text-title-1 text-pretty break-words",
            "transition-colors duration-300 ease-out group-hover:turn group-focus-visible:turn",
            "lg:whitespace-nowrap",
          )}
        >
          {project.name}
        </span>
        <span
          className={cn(
            "col-[2/4] row-[2] text-[14.5px] leading-[1.45] text-muted",
            "md:col-[2/3] md:-mt-1.5 md:text-[15px]",
            "lg:col-[3/4] lg:row-[1] lg:mt-0 lg:-translate-y-[0.3em]",
          )}
        >
          {project.tagline}
        </span>
        <span
          className={cn(
            "caps col-[2/3] row-[3] mt-1 text-muted",
            "md:col-[3/4] md:row-[1] md:mt-0 md:-translate-y-[0.5em]",
            "lg:col-[4/5]",
          )}
        >
          {categoryLabel(project.category)}
        </span>
        <span
          className={cn(
            "caps col-[3/4] row-[1] self-center text-end tabular-nums",
            "md:col-[4/5] md:self-auto md:-translate-y-[0.5em] lg:col-[5/6]",
            year === null ? "text-green" : "text-primary",
          )}
        >
          {year === null ? (
            <>
              <span aria-hidden="true">Now</span>
              <span className="sr-only">In progress</span>
            </>
          ) : (
            year
          )}
        </span>
      </Link>
    </li>
  );
}
