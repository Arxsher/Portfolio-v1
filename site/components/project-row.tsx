// The project list used on the home page (work section) and on /projects:
//
//   [tile]  Name                                                    ›
//           tagline
//
// Each row links to the project's own page. This module stays server-side:
// it turns full projects (content/projects.json) into the few words a row
// and its preview need, so the client only receives those, and hands them
// to <ProjectRows> (components/project-preview.tsx), which adds the motion:
// a floating preview card for mice, a tap-to-expand row on touch, and the
// same details inline for keyboard focus.

import { ProjectRows, type PreviewMeta, type ProjectPreview } from "@/components/project-preview";

/** What a row needs. Full projects from projects.json fit this shape. */
export type ProjectSummary = {
  slug: string;
  name: string;
  tagline: string;
  category?: string;
  date?: string;
  status?: string;
  tags?: ReadonlyArray<string>;
  body?: ReadonlyArray<string>;
};

export function ProjectList({
  projects,
  total,
  className,
}: {
  projects: ReadonlyArray<ProjectSummary>;
  /** How many projects there are in all, when `projects` is only the first
      few (the preview card counts "04 / 10"). Defaults to projects.length. */
  total?: number;
  className?: string;
}) {
  return <ProjectRows items={projects.map(toPreview)} total={total} className={className} />;
}

/* ---------------------------------------------------------------------- */
/* data shaping                                                            */
/* ---------------------------------------------------------------------- */

/** How a category slug reads in the preview. Unknown slugs fall back to
    their words ("machine-learning" → "Machine learning"). */
const CATEGORY_LABELS: Record<string, string> = {
  "ai-agents": "AI agents",
  freelance: "Freelance",
  social: "Social",
  platform: "Platform",
  fullstack: "Full-stack",
  realtime: "Real-time",
  experimental: "Experimental",
  creative: "Creative",
};

const words = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function categoryLabel(slug: string): string {
  return CATEGORY_LABELS[slug] ?? capitalise(slug.replace(/[-_]+/g, " "));
}

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

function isInProgress(project: ProjectSummary): boolean {
  return [project.category, project.status, project.date].some((value) => {
    const key = words(value ?? "");
    return key === "wip" || key === "inprogress";
  });
}

/** Category and date, without saying "in progress" twice; work in progress
    gets one live item instead. */
function metaOf(project: ProjectSummary): PreviewMeta[] {
  const live = isInProgress(project);
  const meta: PreviewMeta[] = [];
  const category = project.category?.trim();
  if (category && words(category) !== "wip") meta.push({ text: categoryLabel(category) });
  const date = project.date?.trim();
  if (live) meta.push({ text: "In progress", live: true });
  else if (date) meta.push({ text: date, dateTime: monthIso(date) });
  return meta;
}

/** About this many characters fit three lines of the preview card. */
const DESCRIPTION_LIMIT = 132;

/**
 * One sentence about the project, taken from the start of its write-up:
 * the first sentence of the first paragraph ("sealed." does not end one),
 * without a leading "A work in progress:" (the live dot says that), and,
 * when it is still long, cut at its first clause break. Falls back to the
 * tagline.
 */
function descriptionOf(project: ProjectSummary): string {
  const first = project.body?.find((paragraph) => paragraph.trim())?.trim();
  if (!first) return project.tagline;
  const sentence = /^(.+?[.!?])(?=\s+[A-Z“"'(]|\s*$)/.exec(first)?.[1] ?? first;
  // Only a sentence whose prefix was cut needs a capital ("sealed." keeps its own case).
  const rest = sentence.replace(/^a work in progress:\s*/i, "").trim();
  let text = rest.length < sentence.trim().length ? capitalise(rest) : rest;
  if (text.length > DESCRIPTION_LIMIT) {
    const cut = text.slice(0, DESCRIPTION_LIMIT).search(/(:|;| —)\s/);
    if (cut > 40) text = `${text.slice(0, cut).trim()}.`;
  }
  return text;
}

/** Up to three tags that add something: not "wip", not the project's own
    slug, not the category again ("real-time" next to Real-time). */
function tagsOf(project: ProjectSummary): string[] {
  const skip = new Set(["wip", words(project.slug), words(project.category ?? "")]);
  return (project.tags ?? []).filter((tag) => !skip.has(words(tag))).slice(0, 3);
}

function toPreview(project: ProjectSummary): ProjectPreview {
  return {
    slug: project.slug,
    name: project.name,
    tagline: project.tagline,
    href: `/projects/${project.slug}/`,
    meta: metaOf(project),
    description: descriptionOf(project),
    tags: tagsOf(project),
  };
}
