// Home page section Two: the work index. The first `site.homeProjectCount`
// projects as big-type rows; when that is not all of them, a foot line says
// how many more there are and leads to the full index on /projects/.

import Link from "next/link";
import { Arrow } from "@/components/ornament";
import { ProjectList } from "@/components/project-row";
import { Section } from "@/components/section";
import { projects, site } from "@/content/site";

export function Work() {
  const shown = projects.slice(0, Math.max(1, site.homeProjectCount));
  const more = projects.length - shown.length;
  return (
    <Section
      id="work"
      label="work"
      numeral="Two"
      title="Selected"
      turn="work"
      count={projects.length}
      badge
      note="Agent platforms, client builds and experiments. Each one opens into its own page."
      action={{ label: "All work", href: "/projects/" }}
    >
      <ProjectList projects={shown} />
      {more > 0 ? (
        <div className="mt-[22px] flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <p className="text-small text-muted">
            {shown.length} of {projects.length} here. {more === 1 ? "One more is" : `${more} more are`} in the full
            index.
          </p>
          <Link href="/projects/" className="link-arrow focus-ring rounded-[4px]">
            See all {projects.length}
            <Arrow />
          </Link>
        </div>
      ) : null}
    </Section>
  );
}
