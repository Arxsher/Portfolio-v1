"use client";

// "Back to top": a round paper button in the bottom-right corner with a
// fine up arrow. It appears once the visitor is one and a half screens
// down (a small spring pop) and hides again near the top. Clicking it
// scrolls home (smoothly unless reduced motion) and hands focus to the
// page content, so the next Tab continues from the top.

import { useEffect, useState } from "react";
import { ArrowUp } from "@/components/icons";

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
    document.getElementById("main")?.focus({ preventScroll: true });
  };

  return (
    <button
      type="button"
      aria-label="Back to top"
      title="Back to top (g g)"
      onClick={toTop}
      tabIndex={visible ? 0 : -1}
      aria-hidden={visible ? undefined : true}
      data-visible={visible ? "" : undefined}
      className="scroll-top fixed end-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 grid size-11 cursor-pointer place-items-center rounded-full border border-line-firm bg-paper text-primary shadow-float transition-[opacity,scale,translate,border-color,color,visibility] duration-[320ms] ease-spring hover:border-primary hover:text-cobalt active:scale-[0.94] sm:end-6 sm:bottom-6 not-data-visible:pointer-events-none not-data-visible:invisible not-data-visible:translate-y-2 not-data-visible:scale-[0.85] not-data-visible:opacity-0 motion-reduce:not-data-visible:translate-y-0 motion-reduce:not-data-visible:scale-100 focus-ring"
    >
      <ArrowUp size={16} />
    </button>
  );
}
