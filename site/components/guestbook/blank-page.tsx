// The guestbook's empty first page: a dotted line to sign on with a cross
// at its start, a pen nib waiting there, a faint dotted ghost of a name and
// "Draw your name here". Shown while the book has no signatures (or is not
// connected yet), never with made-up entries.
//
// When the page itself, or anything marked data-sign inside a `group/sign`
// ancestor (the "Sign the guestbook" button) is hovered or focused, the ghost
// name is traced in cobalt once, as a preview of signing. Reduced motion
// shows it traced straight away.

import { cn } from "@/lib/cn";
import { BookPage, type PageSide } from "./book-page";

const GHOST =
  "M18 74c18-30 34-46 44-40 12 8-20 46-6 50 14 4 30-40 44-38 12 2-6 34 6 36 12 2 22-26 34-24 10 2 0 22 10 22s18-18 28-16c8 2 2 14 10 14 12 0 26-20 40-18 10 2 6 12 16 12 14 0 24-8 36-10";

export function BlankPage({
  folio,
  side,
  className,
}: {
  folio?: string;
  side?: PageSide;
  className?: string;
}) {
  return (
    <BookPage folio={folio} side={side} className={className} signTarget>
      <div aria-hidden="true" className="flex flex-1 flex-col justify-center pb-10">
        <div className="mx-auto w-full max-w-[380px]">
          <svg viewBox="0 0 320 110" className="block h-auto w-full overflow-visible" focusable="false">
            {/* the ghost of a name, in faint dots */}
            <path
              d={GHOST}
              pathLength={1}
              fill="none"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="0.006 0.012"
              className="stroke-cobalt/35"
            />
            {/* traced in cobalt on hover / focus of the sign button */}
            <path
              d={GHOST}
              pathLength={1}
              fill="none"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="1 1"
              className={cn(
                "stroke-cobalt [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-[1600ms] ease-ink",
                "group-has-[[data-sign]:hover]/sign:[stroke-dashoffset:0] group-has-[[data-sign]:focus-visible]/sign:[stroke-dashoffset:0]",
                "motion-reduce:transition-none",
              )}
            />
            {/* the line to sign on, and its cross */}
            <line x1="8" x2="312" y1="92" y2="92" strokeWidth={1.2} strokeDasharray="2 5" className="stroke-line-firm" />
            <path d="M2 80l9 9M11 80l-9 9" strokeWidth={1.6} strokeLinecap="round" className="stroke-terra" />
            {/* a pen nib waiting at the start */}
            <g transform="translate(4 30) rotate(-35 12 30)" className="fill-ink">
              <path d="M6 0h12l-1 22-5 12-5-12z" />
              <path d="M12 22v9" strokeWidth={1.2} strokeLinecap="round" className="stroke-paper" fill="none" />
              <circle cx="12" cy="20" r="1.8" className="fill-paper" />
            </g>
          </svg>
          <p className="caps mt-2 text-center text-muted">Draw your name here</p>
        </div>
      </div>
    </BookPage>
  );
}
