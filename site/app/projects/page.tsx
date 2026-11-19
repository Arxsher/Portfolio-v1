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
    images: [{ url: site.ogImage, ...site.ogImageSize, alt: site.metaTitle }],
  },
};

export default function ProjectsPage() {
  return (
    <>
      <header className="mt-16">
        <h1 className="page-title">Work</h1>
        <p className="page-lede mt-3">{intro}</p>
      </header>
      <div className="mt-10">
        <ProjectList projects={projects} />
      </div>
    </>
  );
}
