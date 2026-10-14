import type { Metadata } from "next";
import { PageHeader } from "@/components/section";
import { WritingList } from "@/components/writing-row";
import { site } from "@/content/site";

const intro = "Longer thoughts, newest first. Posts published on their own sites open in a new tab.";

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

// The writing index (DESIGN.md → Writing): the page heading, then every
// post as a numbered row.
export default function WritingPage() {
  return (
    <>
      <PageHeader kicker="Writing" title="Notes &" turn="essays" count={site.writing.length} lede={intro} />
      <WritingList posts={site.writing} />
    </>
  );
}
