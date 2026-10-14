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
      className="fixed right-4 bottom-[84px] z-30 flex size-10 cursor-pointer items-center justify-center rounded-[14px] bg-raised text-secondary shadow-popover outline-none transition-[opacity,scale,filter,color,visibility] duration-[240ms] ease-out hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.96] sm:right-6 sm:bottom-6 not-data-visible:pointer-events-none not-data-visible:invisible not-data-visible:scale-[0.85] not-data-visible:opacity-0 not-data-visible:blur-[4px] motion-reduce:not-data-visible:scale-100 motion-reduce:not-data-visible:blur-none"
    >
      <ChevronUp />
    </button>
  );
}
