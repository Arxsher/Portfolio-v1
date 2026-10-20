// A lab piece's page: the big stage with the piece running in it, then the
// title with its actions (full screen, share, previous / next), the
// description and the tech it uses, an "About" on how it is made, a
// details card, and cards for the previous and next pieces.
//
//   ┌───────────────────────────────────────────────┐
//   │                  [ controls ]                 │
//   │                    the piece                  │   575px (aspect on phones)
//   │                  [ controls ]                 │
//   └───────────────────────────────────────────────┘
//   Title                        [⤢] [Share] [‹ ›]
//   Description …
//   Uses [Canvas 2D] [Web Audio]
//
//   About
//   …
//   ┌ Built with · Inspired by · Controls · Sound ──┐
//   ‹ Previous            Next ›

import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRightSmall } from "@/components/lab/lab-icons";
import { PieceActions, PieceStage } from "@/components/lab/piece-page";
import { aboutParagraphs, getNeighbours, getPiece, pieces } from "@/components/lab/registry";
import { CATEGORY_SINGULAR, type PieceMeta } from "@/components/lab/types";
import { site } from "@/content/site";
import { withBasePath } from "@/components/lab/base-path";
import { cn } from "@/lib/cn";

export const dynamicParams = false;

export function generateStaticParams() {
  return pieces.map((piece) => ({ slug: piece.slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

/**
 * The piece's own social card (public/lab/og/<slug>.png, a 1200 × 630
 * capture of its stage), else the site's. Checked at build time. Metadata
 * URLs don't get the base path from Next, so it is added here.
 */
function ogImageFor(slug: string): { url: string; width: number; height: number } {
  try {
    if (fs.existsSync(path.join(process.cwd(), "public", "lab", "og", `${slug}.png`))) {
      return { url: withBasePath(`/lab/og/${slug}.png`), width: 1200, height: 630 };
    }
  } catch {}
  return { url: withBasePath(site.ogImage), ...site.ogImageSize };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const piece = getPiece(slug);
  if (!piece) return {};
  const url = withBasePath(`/lab/${piece.slug}/`);
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

/** "Canvas 2D, Web Audio and Springs", with each item in the foreground colour. */
function listOf(items: readonly string[]): ReactNode {
  return items.map((item, index) => (
    <span key={item}>
      {index > 0 ? (index === items.length - 1 ? " and " : ", ") : null}
      <span className="text-primary">{item}</span>
    </span>
  ));
}

function details(piece: PieceMeta): Array<{ label: string; value: ReactNode }> {
  return [
    { label: "Built with", value: <>{listOf([...piece.uses, "React"].filter((v, i, all) => all.indexOf(v) === i))}</> },
    ...(piece.inspiredBy ? [{ label: "Inspired by", value: piece.inspiredBy }] : []),
    ...(piece.controlsHint ? [{ label: "Controls", value: piece.controlsHint }] : []),
    ...(piece.sound
      ? [{ label: "Sound", value: "Made in the browser as you play. The mute switch is shared by every piece." }]
      : []),
    { label: "Category", value: CATEGORY_SINGULAR[piece.category] },
  ];
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
    url: new URL(withBasePath(`/lab/${piece.slug}/`), site.url).toString(),
    keywords: piece.uses.join(", "),
    author: { "@type": "Person", name: site.name, url: site.url },
  };

  return (
    <div data-wide-page="" className="mt-8 flex flex-col sm:mt-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />

      <PieceStage
        slug={piece.slug}
        title={piece.title}
        aspect={piece.stage?.aspect}
        minHeight={piece.stage?.minHeight}
      />

      <div className="px-1 sm:px-1">
        <header className="mt-7 flex items-start justify-between gap-4 sm:mt-8">
          <h1 className="min-w-0 pt-0.5 text-[22px]/[1.3] font-medium tracking-[-0.015em] text-balance text-primary">
            {piece.title}
          </h1>
          <PieceActions
            title={piece.title}
            summary={piece.summary}
            previous={{ slug: previous.slug, title: previous.title }}
            next={{ slug: next.slug, title: next.title }}
          />
        </header>

        <p className="mt-3 max-w-[620px] text-[15px]/[1.65] text-pretty">{piece.description}</p>

        {piece.uses.length ? (
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            <span className="me-0.5 text-[13px] text-tertiary">Uses</span>
            <ul aria-label="Uses" className="flex flex-wrap gap-1.5">
              {piece.uses.map((use) => (
                <li key={use} className="rounded-[7px] bg-well px-2 py-0.5 text-[12.5px] leading-[1.5] text-secondary">
                  {use}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <section aria-labelledby="about" className="mt-12">
          <h2 id="about" className="text-[15px] font-medium text-primary">
            About
          </h2>
          <div className="mt-2.5 flex max-w-[620px] flex-col gap-3.5 text-[14.5px]/[1.65] text-pretty">
            {aboutParagraphs(piece).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </section>
      </div>

      <dl className="mt-7 overflow-hidden rounded-[18px] bg-tile text-[13px]/[1.5]">
        {details(piece).map((row, index) => (
          <div
            key={row.label}
            className={cn(
              "grid grid-cols-1 gap-y-0.5 px-4 py-3 sm:grid-cols-[136px_1fr] sm:gap-x-4 sm:py-3.5",
              index > 0 && "border-t border-border",
            )}
          >
            <dt className="text-primary">{row.label}</dt>
            <dd className="text-secondary">{row.value}</dd>
          </div>
        ))}
      </dl>

      <nav aria-label="More pieces" className="mt-14 grid grid-cols-2 gap-2 sm:gap-3">
        <NeighbourCard piece={previous} label="Previous" />
        <NeighbourCard piece={next} label="Next" align="end" />
      </nav>
    </div>
  );
}

function NeighbourCard({ piece, label, align }: { piece: PieceMeta; label: string; align?: "end" }) {
  const end = align === "end";
  return (
    <Link
      href={`/lab/${piece.slug}/`}
      rel={end ? "next" : "prev"}
      className={cn(
        "group flex min-h-[72px] items-center gap-3 rounded-[16px] bg-tile px-4 py-3 outline-none transition-[background-color,scale] duration-150 ease-out hover:bg-tile-hover active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-5",
        end && "flex-row-reverse text-end",
      )}
    >
      {end ? (
        <ChevronRightSmall
          size={14}
          className="text-tertiary transition-[translate,color] duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-primary"
        />
      ) : (
        <ChevronLeft
          size={14}
          className="text-tertiary transition-[translate,color] duration-200 ease-out group-hover:-translate-x-0.5 group-hover:text-primary"
        />
      )}
      <span className="min-w-0 flex-1 leading-[1.35]">
        <span className="block text-[12px] text-tertiary">{label}</span>
        <span className="mt-0.5 block truncate text-[15px] text-primary">{piece.title}</span>
      </span>
    </Link>
  );
}
