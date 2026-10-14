// A lab piece's page: the paper stage with the piece running in it, then
// the title with the description, how it is made, a fiche of the facts with
// the page's two actions, and the pieces either side as two small niches.
//
//   ╭──────────────────────── ✦ ────────────────────────╮
//   │                 [ controls ]                       │
//   │                  the piece                         │   575px (aspect on phones)
//   │                 [ controls ]                       │
//   └────────────────────────────────────────────────────┘
//   ✦──────────────────────────────────────────────────────
//   LAB / ZELLIGE                          [⤢ Full screen] [⛓ Copy link]
//   Zellige                                ──────────────────────────
//   A wall of Moroccan zellige …           KIND        Generative
//                                          MADE WITH   (Canvas 2D) (Springs)
//   How it is made                         INSPIRED BY …
//   …                                      CONTROLS    …
//
//                          ──── ✦ ────
//   ⌒ ← PREVIOUS                                            NEXT → ⌒
//     Seal                                               Macropad

import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { PieceArt, artGround } from "@/components/lab/lab-art";
import { PieceActions, PieceStage } from "@/components/lab/piece-page";
import { aboutParagraphs, getNeighbours, getPiece, pieceNumber, pieces } from "@/components/lab/registry";
import { CATEGORY_SINGULAR, type PieceMeta } from "@/components/lab/types";
import { ArchFrame, Arrow, StarRule } from "@/components/ornament";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { pad } from "@/lib/format";

export const dynamicParams = false;

export function generateStaticParams() {
  return pieces.map((piece) => ({ slug: piece.slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

/** The piece's own social card if it has been generated (public/lab/og/<slug>.png), else the site's. */
function ogImageFor(slug: string): { url: string; width: number; height: number } {
  const own = `/lab/og/${slug}.png`;
  try {
    if (fs.existsSync(path.join(process.cwd(), "public", "lab", "og", `${slug}.png`))) {
      return { url: own, width: 1200, height: 630 };
    }
  } catch {}
  return { url: site.ogImage, ...site.ogImageSize };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const piece = getPiece(slug);
  if (!piece) return {};
  const url = `/lab/${piece.slug}/`;
  const image = ogImageFor(piece.slug);
  const title = `${piece.title} • ${site.name}`;
  return {
    title: piece.title,
    description: piece.summary,
    alternates: { canonical: url },
    // Page-level openGraph replaces the layout's, so the shared bits are repeated.
    openGraph: {
      type: "website",
      url,
      siteName: site.name,
      title,
      description: piece.summary,
      images: [{ ...image, alt: piece.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: piece.summary,
      images: [{ url: image.url, alt: piece.title }],
    },
  };
}

/** The facts about the piece, for the fiche. */
function facts(piece: PieceMeta): Array<{ label: string; value: ReactNode }> {
  return [
    { label: "Kind", value: CATEGORY_SINGULAR[piece.category] },
    ...(piece.uses.length
      ? [
          {
            label: "Made with",
            value: (
              <ul aria-label="Made with" className="-mt-0.5 flex flex-wrap gap-1.5">
                {piece.uses.map((use) => (
                  <li key={use} className="tag">
                    {use}
                  </li>
                ))}
              </ul>
            ),
          },
        ]
      : []),
    ...(piece.inspiredBy ? [{ label: "Inspired by", value: piece.inspiredBy }] : []),
    ...(piece.controlsHint ? [{ label: "Controls", value: piece.controlsHint }] : []),
    ...(piece.sound ? [{ label: "Sound", value: "Made in the browser as you play. One mute switch serves every piece." }] : []),
  ];
}

/** The poster on the stage while the piece loads (or while it is still being built): the drawing in an arch. */
function StagePoster({ slug }: { slug: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-paper pt-[5%] pb-[9%] [--background:var(--paper)]">
      <ArchFrame className="h-[78%] max-h-[400px]" keystoneSize={16} windowStyle={{ background: artGround(slug) }}>
        <PieceArt slug={slug} uid={`stage-${slug}`} />
      </ArchFrame>
      {/* the sill */}
      <span aria-hidden="true" className="h-px w-[min(72%,420px)] bg-line-firm" />
    </div>
  );
}

export default async function LabPiecePage({ params }: PageProps) {
  const { slug } = await params;
  const piece = getPiece(slug);
  const neighbours = getNeighbours(slug);
  if (!piece || !neighbours) notFound();
  const { previous, next } = neighbours;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: piece.title,
    description: piece.summary,
    url: new URL(`/lab/${piece.slug}/`, site.url).toString(),
    keywords: piece.uses.join(", "),
    author: { "@type": "Person", name: site.name, url: site.url },
  };

  return (
    <div data-wide-page="" className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />

      <div className="mt-[clamp(32px,4.5vw,56px)]">
        <PieceStage
          slug={piece.slug}
          title={piece.title}
          aspect={piece.stage?.aspect}
          minHeight={piece.stage?.minHeight}
          poster={<StagePoster slug={piece.slug} />}
        />
      </div>

      <div className="mt-[clamp(48px,6vw,80px)]">
        <StarRule />
        <div className="mt-[22px] grid gap-x-[clamp(32px,6vw,96px)] [grid-template-areas:'head'_'aside'_'about'] md:grid-cols-[minmax(0,1fr)_minmax(0,340px)] md:grid-rows-[auto_1fr] md:[grid-template-areas:'head_aside'_'about_aside']">
          <header className="min-w-0 [grid-area:head]">
            <nav aria-label="Breadcrumb" className="mb-3">
              <ol className="kicker flex flex-wrap items-center gap-x-2 gap-y-1">
                <li>
                  <Link
                    href="/lab/"
                    className="rounded-[4px] underline decoration-transparent underline-offset-[3px] transition-colors duration-200 hover:decoration-current focus-ring"
                  >
                    Lab
                  </Link>
                </li>
                <li aria-hidden="true" className="text-line-firm">
                  /
                </li>
                <li aria-current="page" className="text-muted">
                  <span className="numeral me-1.5 text-[13px] tracking-normal">{pad(pieceNumber(piece.slug))}</span>
                  {piece.title}
                </li>
              </ol>
            </nav>
            <h1 id="page-title" className="section-head__title font-display text-display-3">
              {piece.title}
            </h1>
            <p className="page-lede mt-5">{piece.description}</p>
          </header>

          <aside aria-label="About this piece" className="mt-9 min-w-0 [grid-area:aside] md:mt-0 md:pt-[30px]">
            <PieceActions
              title={piece.title}
              previous={{ slug: previous.slug, title: previous.title }}
              next={{ slug: next.slug, title: next.title }}
            />
            <dl className="fiche mt-5">
              {facts(piece).map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="keys-hint mt-4 flex items-center gap-1.5 text-caption text-muted max-sm:hidden">
              <kbd className="kbd">←</kbd>
              <kbd className="kbd">→</kbd>
              <span className="ms-1">walk to the next niche</span>
            </p>
          </aside>

          <section aria-labelledby="piece-made" className="mt-[clamp(44px,5vw,64px)] min-w-0 [grid-area:about]">
            <h2 id="piece-made" className="font-display text-title-2 text-primary">
              How it is <em className="turn">made</em>
            </h2>
            <div className="mt-4 flex max-w-[64ch] flex-col gap-4 text-copy text-pretty text-body">
              {aboutParagraphs(piece).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>
        </div>
      </div>

      <nav aria-label="More pieces" className="mt-[var(--section-gap)]">
        <StarRule align="center" />
        <div className="mt-[clamp(28px,4vw,48px)] grid grid-cols-1 gap-y-8 sm:grid-cols-2 sm:gap-x-8">
          <NeighbourNiche piece={previous} direction="previous" />
          <NeighbourNiche piece={next} direction="next" />
        </div>
      </nav>
    </div>
  );
}

function NeighbourNiche({ piece, direction }: { piece: PieceMeta; direction: "previous" | "next" }) {
  const isNext = direction === "next";
  const word = isNext ? "Next" : "Previous";
  return (
    <Link
      href={`/lab/${piece.slug}/`}
      rel={isNext ? "next" : "prev"}
      data-row=""
      aria-label={`${word} piece: ${piece.title}`}
      aria-keyshortcuts={isNext ? "ArrowRight" : "ArrowLeft"}
      className={cn(
        "group flex items-end gap-4 rounded-[4px] text-primary focus-ring-far sm:gap-6",
        isNext && "flex-row-reverse text-end",
      )}
    >
      <ArchFrame className="w-[72px] shrink-0 sm:w-[104px]" keystoneSize={12} windowStyle={{ background: artGround(piece.slug) }}>
        <div className="absolute inset-0 transition-[scale,translate] duration-700 ease-out group-hover:-translate-y-[2%] group-hover:scale-[1.06] group-focus-visible:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:scale-100 motion-reduce:group-focus-visible:scale-100">
          <PieceArt slug={piece.slug} uid={`${direction}-${piece.slug}`} />
        </div>
      </ArchFrame>
      <span aria-hidden="true" className="min-w-0 pb-1">
        <span className={cn("caps flex items-center gap-2 text-muted", isNext && "justify-end")}>
          {isNext ? null : <Arrow className="rotate-180 group-hover:-translate-x-1" />}
          {word}
          {isNext ? <Arrow className="group-hover:translate-x-1" /> : null}
        </span>
        <span className="mt-2 block font-display text-[22px] leading-[1.15] tracking-[-0.015em] text-balance text-primary transition-colors duration-300 group-hover:turn group-focus-visible:turn sm:text-title-2">
          {piece.title}
        </span>
        <span className="caps mt-1.5 block text-muted">{CATEGORY_SINGULAR[piece.category]}</span>
      </span>
    </Link>
  );
}
