import type { Metadata } from "next";
import { ProjectList } from "@/components/project-row";
import { projects, site } from "@/content/site";

const intro = "Products, client sites and experiments I designed and built.";

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
    images: [{ url: site.ogImage, width: 1200, height: 675, alt: site.metaTitle }],
  },
};

export default function ProjectsPage() {
  return (
    <>
      <header className="mt-16">
        <h1 className="text-[30px] leading-[1.15] tracking-[-0.025em] text-balance text-primary">Work</h1>
        <p className="mt-3 max-w-[56ch] text-[16px] leading-[1.5] text-pretty">{intro}</p>
      </header>
      <div className="mt-10">
        <ProjectList projects={projects} />
      </div>
    </>
  );
}
