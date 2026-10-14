"use client";

// Round "back to top" button, bottom right. It appears once the visitor is
// one and a half screens down and pops in/out with a blur + scale. On
// phones it sits above the floating dock; from `sm` it moves into the
// corner.

import { useEffect, useState } from "react";
import { ChevronUp } from "@/components/icons";

const THRESHOLD = 1.5; // in viewport heights

export function ScrollTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setVisible(window.scrollY > window.innerHeight * THRESHOLD);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const toTop = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    // The button hides itself at the top, so hand focus to the page content
    // (the next Tab then continues from the top, not from the dock).
    document.getElementById("main")?.focus({ preventScroll: true });
  };

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={toTop}
      tabIndex={visible ? 0 : -1}
      aria-hidden={visible ? undefined : true}
      data-visible={visible ? "" : undefined}
      style={{ viewTransitionName: "site-top" }}
      className="fixed end-4 bottom-[84px] z-30 grid size-10 cursor-pointer place-items-center rounded-[14px] bg-float text-secondary shadow-float transition-[opacity,scale,filter,color,visibility] duration-[240ms] ease-out hover:text-primary active:scale-[0.96] sm:end-6 sm:bottom-6 not-data-visible:pointer-events-none not-data-visible:invisible not-data-visible:scale-[0.85] not-data-visible:opacity-0 not-data-visible:blur-[4px] motion-reduce:not-data-visible:scale-100 motion-reduce:not-data-visible:blur-none focus-ring"
    >
      <ChevronUp />
    </button>
  );
}
