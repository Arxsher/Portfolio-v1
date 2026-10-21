// Home page "work" section: the first few projects, with the total count in
// the header and a link to the full list on /projects. Rows get their motion
// from components/project-preview.tsx (preview card on hover, inline details
// on tap and keyboard focus).

import { ProjectList } from "@/components/project-row";
import { Section } from "@/components/section";
import { projects, site } from "@/content/site";

export function Work() {
  const shown = projects.slice(0, site.homeProjectCount);
  return (
    <Section id="work" label="work" count={projects.length} action={{ label: "All work", href: "/projects/" }}>
      <ProjectList projects={shown} total={projects.length} />
    </Section>
  );
}
