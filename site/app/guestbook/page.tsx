import type { Metadata } from "next";
import { GuestbookBook } from "@/components/guestbook/book";
import { GUESTBOOK_LEDE } from "@/components/guestbook/copy";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Guestbook",
  description: GUESTBOOK_LEDE,
  alternates: { canonical: "/guestbook/" },
  // Page-level openGraph replaces the layout's, so the shared bits are repeated.
  openGraph: {
    type: "website",
    url: "/guestbook/",
    siteName: site.name,
    title: `Guestbook • ${site.name}`,
    description: GUESTBOOK_LEDE,
    images: [{ url: site.ogImage, ...site.ogImageSize, alt: site.metaTitle }],
  },
};

export default function GuestbookPage() {
  return <GuestbookBook />;
}
