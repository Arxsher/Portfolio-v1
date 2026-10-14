import type { Metadata } from "next";
import { GuestbookWall, SignItButton } from "@/components/guestbook/wall";
import { site } from "@/content/site";

const intro = "Notes from people who passed through, each one signed by hand.";

export const metadata: Metadata = {
  title: "Guestbook",
  description: intro,
  alternates: { canonical: "/guestbook/" },
  // Page-level openGraph replaces the layout's, so the shared bits are repeated.
  openGraph: {
    type: "website",
    url: "/guestbook/",
    siteName: site.name,
    title: `Guestbook • ${site.name}`,
    description: intro,
    images: [{ url: site.ogImage, ...site.ogImageSize, alt: site.metaTitle }],
  },
};

export default function GuestbookPage() {
  return (
    <>
      <header className="mt-16">
        <h1 className="page-title">Guestbook</h1>
        <div className="page-lede mt-3">
          <p>{intro}</p>
          <div className="mt-5 flex">
            <SignItButton />
          </div>
        </div>
      </header>
      <GuestbookWall />
    </>
  );
}
