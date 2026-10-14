import type { Metadata } from "next";
import Link from "next/link";
import { Doc, Folder, Home, Sparkle } from "@/components/icons";
import { MissingPath } from "@/components/not-found-bits";
import { BrokenLinksGame } from "@/components/not-found-game";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

const wayOut =
  "inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-[12px] bg-tile ps-3.5 pe-4 text-[15px] text-primary shadow-[0_0_0_1px_var(--edge),0_1px_2px_-1px_rgb(0_0_0/0.05)] outline-none transition-[box-shadow,background-color,color,opacity,scale] duration-150 ease-out hover:bg-wash hover:shadow-[0_0_0_1px_var(--edge-firm),0_1px_3px_-1px_rgb(0_0_0/0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/50 active:scale-[0.96]";

const wayOutLead =
  "inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-[12px] bg-ink ps-[18px] pe-5 text-[15px] font-medium text-on-ink outline-none transition-[opacity,scale] duration-150 ease-out hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/50 active:scale-[0.96]";

export default function NotFound() {
  return (
    <>
      <header className="mt-16">
        <h1 className="page-title">Page not found</h1>
        <p className="page-lede mt-3">
          Nothing lives at <MissingPath />. It may have moved while I was rebuilding things, or the link picked up a
          typo on the way here.
        </p>
      </header>

      <BrokenLinksGame />

      <hr className="mt-8 border-border" />
      <nav aria-label="Ways back" className="mt-6 flex flex-wrap gap-2">
        <Link href="/" className={wayOutLead}>
          <Home size={15} />
          Home
        </Link>
        <Link href="/writing/" className={wayOut}>
          <Doc size={15} />
          Writing
        </Link>
        <Link href="/projects/" className={wayOut}>
          <Folder size={15} />
          Work
        </Link>
        <Link href="/lab/" className={wayOut}>
          <Sparkle size={15} />
          Lab
        </Link>
      </nav>
    </>
  );
}
