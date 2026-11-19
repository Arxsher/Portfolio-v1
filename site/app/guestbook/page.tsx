import type { Metadata } from "next";
import { FoldPlaneButton, PaperPlanesWall } from "@/components/guestbook/wall";
import { site } from "@/content/site";

const intro = "Notes from people who passed by, each folded into a paper plane. Catch one to read it, or fold your own.";

export const metadata: Metadata = {
  title: "Paper planes",
  description: intro,
  alternates: { canonical: "/guestbook/" },
  // Page-level openGraph replaces the layout's, so the shared bits are repeated.
  openGraph: {
    type: "website",
    url: "/guestbook/",
    siteName: site.name,
    title: `Paper planes • ${site.name}`,
    description: intro,
    images: [{ url: site.ogImage, ...site.ogImageSize, alt: site.metaTitle }],
  },
};

export default function GuestbookPage() {
  return (
    <>
      <header className="mt-16">
        <h1 className="page-title">Paper planes</h1>
        <div className="page-lede mt-3">
          <p>{intro}</p>
          <div className="mt-5 flex">
            <FoldPlaneButton />
          </div>
        </div>
      </header>
      <PaperPlanesWall />
    </>
  );
}
