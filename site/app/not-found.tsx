import type { Metadata } from "next";
import Link from "next/link";
import { Folder, Home } from "@/components/icons";
import { MissingPath, SayHiButton } from "@/components/not-found-bits";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

const wayOut =
  "inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-[12px] bg-surface ps-3.5 pe-4 text-[15px] text-primary shadow-[0_0_0_1px_var(--ring),0_1px_2px_-1px_rgb(0_0_0/0.05)] outline-none transition-[box-shadow,background-color,color,opacity,scale] duration-150 ease-out hover:bg-tint hover:shadow-[0_0_0_1px_var(--ring-strong),0_1px_3px_-1px_rgb(0_0_0/0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/50 active:scale-[0.96]";

const wayOutLead =
  "inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-[12px] bg-btn ps-[18px] pe-5 text-[15px] font-medium text-btn-fg outline-none transition-[opacity,scale] duration-150 ease-out hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/50 active:scale-[0.96]";

export default function NotFound() {
  return (
    <>
      <header className="mt-16">
        <h1 className="text-[30px] leading-[1.15] tracking-[-0.025em] text-balance text-primary">Page not found</h1>
        <p className="mt-3 max-w-[56ch] text-[16px] leading-[1.5] text-pretty">
          Nothing lives at <MissingPath />. It may have moved while I was rebuilding things, or the link picked up a
          typo on the way here.
        </p>
      </header>

      <nav aria-label="Ways back" className="mt-10 border-t border-border pt-6">
        <p className="text-[13px] text-tertiary">Try one of these instead</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/" className={wayOutLead}>
            <Home size={15} />
            Home
          </Link>
          <Link href="/projects/" className={wayOut}>
            <Folder size={15} />
            Work
          </Link>
          <SayHiButton className={wayOut} />
        </div>
      </nav>
    </>
  );
}
