import type { Metadata } from "next";
import { WritingList } from "@/components/writing-row";
import { site } from "@/content/site";

const intro = "Things I’ve written, newest first.";

export const metadata: Metadata = {
  title: "Writing",
  description: intro,
  alternates: { canonical: "/writing/" },
  // Page-level openGraph replaces the layout's, so the shared bits are repeated.
  openGraph: {
    type: "website",
    url: "/writing/",
    siteName: site.name,
    title: `Writing • ${site.name}`,
    description: intro,
    images: [{ url: site.ogImage, ...site.ogImageSize, alt: site.metaTitle }],
  },
};

export default function WritingPage() {
  return (
    <>
      <header className="mt-16">
        <h1 className="page-title">Writing</h1>
        <p className="page-lede mt-3">{intro}</p>
      </header>
      <div className="mt-10">
        <WritingList posts={site.writing} />
      </div>
    </>
  );
}
