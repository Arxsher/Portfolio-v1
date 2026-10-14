// The project list used on the home page (work section) and on /projects:
//
//   [tile]  Name                                                    ›
//           tagline
//
// Each row links to the project's own page. Hovering a row (with a fine
// pointer) fades the other rows back so the one under the cursor stands out;
// the name picks up an underline and the chevron darkens.

import Link from "next/link";
import { ChevronRight } from "@/components/icons";
import { ProjectTile } from "@/components/project-icons";
import { cn } from "@/lib/cn";

export type ProjectSummary = {
  slug: string;
  name: string;
  tagline: string;
};

/** Only mice and trackpads get the fade; touch has no hover to anchor it. */
const dimOthers =
  "[@media(hover:hover)_and_(pointer:fine)]:[&:has(>li:hover)>li:not(:hover)]:opacity-45";

export function ProjectList({
  projects,
  className,
}: {
  projects: ReadonlyArray<ProjectSummary>;
  className?: string;
}) {
  return (
    <ul className={cn(dimOthers, className)}>
      {projects.map((project) => (
        <ProjectRow key={project.slug} project={project} />
      ))}
    </ul>
  );
}

export function ProjectRow({ project }: { project: ProjectSummary }) {
  return (
    <li className="transition-opacity duration-200 ease-out">
      <Link
        href={`/projects/${project.slug}/`}
        className="group flex items-center gap-4 rounded-[14px] py-3 focus-ring-far"
      >
        <ProjectTile slug={project.slug} />
        <span className="min-w-0 flex-1 leading-[1.4]">
          <span className="hover-underline block font-medium text-primary group-hover:decoration-current">
            {project.name}
          </span>
          <span className="block text-[15px] text-secondary">{project.tagline}</span>
        </span>
        <ChevronRight size={14} className="text-tertiary transition-colors duration-150 group-hover:text-primary" />
      </Link>
    </li>
  );
}
