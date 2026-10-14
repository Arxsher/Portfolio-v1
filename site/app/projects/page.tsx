import type { Metadata } from "next";
import { ProjectList, projectYear } from "@/components/project-row";
import { PageHeader } from "@/components/section";
import { projects, site } from "@/content/site";

const intro =
  "Agent platforms, client builds and experiments, each with its own page: what it does, how it is built and where to find it.";

export const metadata: Metadata = {
  title: "Work",
  description: intro,
  alternates: { canonical: "/projects/" },
  // Page-level openGraph replaces the layout's, so the shared bits are repeated.
  openGraph: {
    type: "website",
    url: "/projects/",
    siteName: site.name,
    title: `Work • ${site.name}`,
    description: intro,
    images: [{ url: site.ogImage, ...site.ogImageSize, alt: site.metaTitle }],
  },
};

/** "10 projects · 2025 to 2026 · 2 in the works", worked out from projects.json. */
function summary(): string[] {
  const years = projects.map((project) => projectYear(project.date)).filter((year): year is number => year !== null);
  const building = projects.length - years.length;
  const parts = [`${projects.length} ${projects.length === 1 ? "project" : "projects"}`];
  if (years.length) {
    const first = Math.min(...years);
    const last = Math.max(...years);
    parts.push(first === last ? String(first) : `${first} to ${last}`);
  }
  if (building) parts.push(`${building} in the works`);
  return parts;
}

export default function ProjectsPage() {
  return (
    <>
      <PageHeader kicker="Work" title="Selected" turn="work" count={projects.length} lede={intro} />
      <ProjectList projects={projects} />
      <p className="caps mt-[22px] flex flex-wrap gap-x-2 text-muted">
        {summary().map((part, index) => (
          <span key={part} className="contents">
            {index > 0 ? <span aria-hidden="true">·</span> : null}
            <span>{part}</span>
          </span>
        ))}
      </p>
    </>
  );
}
