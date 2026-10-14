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
    images: [{ url: site.ogImage, width: 1200, height: 675, alt: site.metaTitle }],
  },
};

export default function GuestbookPage() {
  return (
    <>
      <header className="mt-16">
        <h1 className="text-[30px] leading-[1.15] tracking-[-0.025em] text-balance text-primary">Guestbook</h1>
        <div className="mt-3 max-w-[56ch] text-[16px] leading-[1.5] text-pretty">
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
