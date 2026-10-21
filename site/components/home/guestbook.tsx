"use client";

// Home page guestbook: the guest house (components/guestbook/house), where
// every signature is a lit window with the guest's own hand-drawn
// signature on the pane. Point at a window (or tap it) and the note leans
// out; the dashed window is the next free one and opens the sign form, as
// does the button in the panel. Signing flies your signature from the form
// into that window.
//
//   guestbook / 12 signed ................................ Read them all ›
//   ┌──────────────────────────────────────────────────────────────────┐
//   │ Every signature lights a window.              [ ✎ Sign the book ] │
//   │                    ▟▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▙                            │
//   │                    █ ▢ ▢ ▢ ▢ ▢ █                                  │
//   │                    █ ▣ ▣ ▣ ▣ ⬚ █        (▣ lit · ⬚ yours)         │
//   │              🌳    █▄▄ GUESTBOOK ▄▄█   ┃                           │
//   └──────────────────────────────────────────────────────────────────┘
//
// Home shows the lobby and the newest floors (MAX_FLOORS); a taller house
// hides the floors in between behind a break line. The entries load in
// the browser; until then the building stands with its lights off. No
// entries, no fake ones: an unlit house with one glowing "your window".

import { useGuestbook } from "@/components/guestbook/data";
import { GuestHouse } from "@/components/guestbook/house/house";
import { PER_FLOOR } from "@/components/guestbook/house/layout";
import { Pen } from "@/components/icons";
import { Section } from "@/components/section";
import { useFinePointer } from "@/components/lab/hooks";
import { openCommand } from "@/lib/command";

const MAX_FLOORS = 4;
/** Enough entries to fill every window home can show. */
const SHOWN = MAX_FLOORS * PER_FLOOR;

export function Guestbook() {
  const { status, entries, count, enabled } = useGuestbook(SHOWN);
  const fine = useFinePointer();
  const guests = Math.max(count ?? 0, entries.length);

  const hint =
    status === "error"
      ? "Couldn't load the guestbook right now."
      : !enabled
        ? "The guestbook isn't connected yet. The lights come on once it is."
        : status === "ready" && guests === 0
          ? "No one has signed yet. The first window is yours."
          : status === "ready"
            ? fine
              ? "Every signature lights a window. Point at one to read it."
              : "Every signature lights a window. Tap one."
            : "Turning the lights on…";

  return (
    <Section
      id="guestbook"
      label="guestbook"
      count={enabled && count !== null ? `${count} signed` : undefined}
      action={{ label: "Read them all", href: "/guestbook/" }}
    >
      <GuestHouse
        entries={entries}
        count={count}
        status={status}
        enabled={enabled}
        maxFloors={MAX_FLOORS}
        hint={hint}
        action={<SignButton />}
      />
    </Section>
  );
}

export function SignButton({ label = "Sign the guestbook" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => openCommand("guestbook")}
      className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-pill bg-float px-3 text-[13px] text-primary shadow-lift transition-[box-shadow,scale] duration-150 ease-out hover:shadow-lift-hover active:scale-[0.96] focus-ring"
    >
      <Pen size={14} className="text-secondary" />
      <span className="max-sm:hidden">{label}</span>
      <span className="sm:hidden">Sign</span>
    </button>
  );
}
