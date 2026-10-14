// Temporary QA page for the work area (the integration step deletes preview-* routes).
import { Work } from "@/components/home/work";
import { ProjectIcon, ProjectTile } from "@/components/project-icons";
import { ProjectList } from "@/components/project-row";
import { projects } from "@/content/site";

export default function PreviewWork() {
  return (
    <>
      <div className="mt-10 grid grid-cols-5 gap-3">
        {projects.map((project) => (
          <div key={project.slug} className="flex flex-col items-center gap-2 rounded-[14px] p-3 text-[11px] text-tertiary ring-1 ring-border">
            <ProjectIcon slug={project.slug} className="size-20 text-primary" />
            <ProjectTile slug={project.slug} />
            {project.slug}
          </div>
        ))}
      </div>
      <Work />
      <section className="mt-20">
        <h2 className="text-[13px] text-secondary">all</h2>
        <ProjectList className="mt-4" projects={projects} />
      </section>
    </>
  );
}
