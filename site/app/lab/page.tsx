// The lab index: every piece, live, in an arcade, with filters, search and
// a list view. The interactive part is components/lab/lab-index.tsx; this
// page adds the heading and draws the posters on the server.

import type { Metadata } from "next";
import { PieceArt, artGround } from "@/components/lab/lab-art";
import { LabIndex, type PiecePoster } from "@/components/lab/lab-index";
import { pieces } from "@/components/lab/registry";
import { PageHeader } from "@/components/section";
import { site } from "@/content/site";

const intro =
  "Small interactive pieces: components, objects and generative scenes, all drawn in code and running live in your browser.";

export const metadata: Metadata = {
  title: "Lab",
  description: intro,
  alternates: { canonical: "/lab/" },
  // Page-level openGraph replaces the layout's, so the shared bits are repeated.
  openGraph: {
    type: "website",
    url: "/lab/",
    siteName: site.name,
    title: `Lab • ${site.name}`,
    description: intro,
    images: [{ url: site.ogImage, ...site.ogImageSize, alt: site.metaTitle }],
  },
};

export default function LabPage() {
  const posters: Record<string, PiecePoster> = Object.fromEntries(
    pieces.map((piece) => [
      piece.slug,
      { poster: <PieceArt slug={piece.slug} uid={`lab-${piece.slug}`} />, ground: artGround(piece.slug) },
    ]),
  );

  return (
    <div data-wide-page="" className="flex flex-col">
      <PageHeader kicker="Lab" title="Pieces drawn" turn="in code" count={pieces.length} lede={intro} />
      <LabIndex posters={posters} />
    </div>
  );
}
