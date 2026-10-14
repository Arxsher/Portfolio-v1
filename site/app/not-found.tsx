import type { Metadata } from "next";
import { MissingPath, WaysBack } from "@/components/not-found-bits";
import { ClosedDoor } from "@/components/not-found-door";
import { LooseTiles } from "@/components/not-found-game";
import { PageHeader } from "@/components/section";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

// The 404 (DESIGN.md → 404): an honest closed door, one line naming the
// missing address, two ways on, and a small game for anyone who lingers.
// The markup is the same for every missing URL; the address fills in once
// the page is in the browser.
export default function NotFound() {
  return (
    <>
      <PageHeader
        kicker="404 · Not found"
        title="This door is"
        turn="closed"
        // the door: centred in its column, and above the title on phones
        className="md:[&_[data-aside]]:items-center [&_[data-aside]>:last-child]:items-center max-md:[&_[data-aside]>:last-child]:order-first max-md:[&_[data-aside]>:last-child]:mb-2"
        lede={
          <>
            <p>
              No page answers at <MissingPath />. It may have moved during the rebuild, or the link picked up a typo on
              its way here.
            </p>
            <div className="mt-8">
              <WaysBack />
            </div>
          </>
        }
        aside={<ClosedDoor className="w-[150px] md:w-[min(270px,100%)]" />}
      />
      <LooseTiles />
    </>
  );
}
