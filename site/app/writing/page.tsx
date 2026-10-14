import type { Metadata } from "next";
import { WritingList } from "@/components/writing-row";
import { site } from "@/content/site";

const intro = "Notes and essays on design, code and AI. Newest first.";

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
    images: [{ url: site.ogImage, width: 1200, height: 675, alt: site.metaTitle }],
  },
};

export default function WritingPage() {
  return (
    <>
      <header className="mt-16">
        <h1 className="text-[30px] leading-[1.15] tracking-[-0.025em] text-balance text-primary">Writing</h1>
        <p className="mt-3 max-w-[56ch] text-[16px] leading-[1.5] text-pretty">{intro}</p>
      </header>
      <div className="mt-10">
        <WritingList posts={site.writing} />
      </div>
    </>
  );
}
