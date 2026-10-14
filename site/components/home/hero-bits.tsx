"use client";

// The interactive parts of the home hero (components/home/hero.tsx):
//
//   <HeroWindow piece="dusk" label="…" nightLabel="…" caption="Casablanca at dusk">
//     <DuskPoster />
//   </HeroWindow>
//   <JumpLink to="contact" className="btn btn-solid btn-lg">Write to me</JumpLink>
//
// HeroWindow is the arched window on the right of the hero. It shows its
// children (the poster: a cheap code-drawn still or loop) straight away,
// then mounts the live lab piece over it with LoadPiece in tile mode once
// the page is idle. The piece's layer stays invisible until the piece has
// actually drawn something (a <canvas> or <svg> inside it), so the loading
// sheen, a piece that is still a placeholder, or one that failed never
// cover the poster; once it has arrived it fades in and the poster stops.
// The piece runs only while the window is on screen and the tab is
// visible; LoadPiece hands it `reducedMotion` so it shows a still frame.
//
// DuskPoster is "Casablanca at dusk" painted with Canvas 2D through a 4x4
// ordered dither: the Atlantic at sunset, the minaret on its point, the
// city to the east (by night: the moon, stars and lit windows). The sun
// leans toward the pointer. It animates at ~20 fps only while it is the
// thing on show (on screen, tab visible, no live piece over it, motion
// allowed) and paints one still frame otherwise.

import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { ArchFrame, Arrow } from "@/components/ornament";
import { useInView, usePageVisible, useReducedMotion, useTheme } from "@/components/lab/hooks";
import { LoadPiece } from "@/components/lab/load-piece";
import { cn } from "@/lib/cn";

/* ---------------------------------------------------------------------- */
/* the window                                                              */
/* ---------------------------------------------------------------------- */

/** Whether the poster is what is on show and may animate. */
const PosterActive = createContext(true);

export function HeroWindow({
  piece,
  href,
  label,
  nightLabel,
  caption,
  children,
  className,
}: {
  /** Lab slug mounted live in the window (components/lab/load-piece.tsx); null for the poster alone. */
  piece: string | null;
  /** Where the window leads (the piece's page). */
  href: string;
  /** What the scene shows, for screen readers (by day / by night). */
  label: string;
  nightLabel?: string;
  /** The visible caption under the sill ("Casablanca at dusk"). Starts the link's accessible name. */
  caption: string;
  /** The poster: shown at once, and whenever the live piece is loading or unavailable. */
  children?: ReactNode;
  className?: string;
}) {
  const hostRef = useRef<HTMLAnchorElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const visible = usePageVisible();
  const onScreen = useInView(hostRef);
  const near = useInView(hostRef, { rootMargin: "200px 0px", once: true });
  const [mounted, setMounted] = useState(false);
  const [arrived, setArrived] = useState(false);

  // Mount the live piece once the page has settled (it is a separate chunk
  // and, for dusk, a WebGL context: no need to compete with hydration).
  useEffect(() => {
    if (!piece || !near || mounted) return;
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setMounted(true), { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setMounted(true), 400);
    return () => clearTimeout(id);
  }, [piece, near, mounted]);

  // The piece has arrived when it has put something drawn on the page.
  useEffect(() => {
    const layer = layerRef.current;
    if (!mounted || !layer) return;
    let timer = 0;
    const check = () => {
      if (!layer.querySelector("canvas, svg")) return false;
      observer.disconnect();
      // a beat for the first frame (shaders compile, the piece fades in)
      timer = window.setTimeout(() => setArrived(true), 220);
      return true;
    };
    const observer = new MutationObserver(check);
    if (!check()) observer.observe(layer, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [mounted]);

  const running = onScreen && visible;
  const split = caption.lastIndexOf(" ") + 1;
  const captionHead = caption.slice(0, split);
  const captionTail = caption.slice(split);
  const sceneLabel = theme === "dark" && nightLabel ? nightLabel : label;

  return (
    <Link
      ref={hostRef}
      href={href}
      className={cn(
        "group block rounded-[50%_50%_8px_8px/36%_36%_8px_8px] text-primary outline-none focus-visible:outline-2 focus-visible:outline-offset-[6px] focus-visible:outline-cobalt",
        className,
      )}
    >
      <ArchFrame keystoneSize={20}>
        <div role="img" aria-label={`${caption}. ${sceneLabel}`} className="absolute inset-0">
          {/* Before any script: a plain dusk (or night) sky over the sea. */}
          <div aria-hidden="true" className="absolute inset-0 dark:hidden" style={{ backgroundImage: DUSK_SKY }} />
          <div aria-hidden="true" className="absolute inset-0 hidden dark:block" style={{ backgroundImage: NIGHT_SKY }} />
          <PosterActive.Provider value={running && !arrived}>{children}</PosterActive.Provider>
          {piece ? (
            <div
              ref={layerRef}
              aria-hidden="true"
              className={cn(
                "absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none",
                arrived ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              {mounted ? <LoadPiece slug={piece} mode="tile" active={running && arrived} /> : null}
            </div>
          ) : null}
          {/* a soft light from the top of the window */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_42%_at_50%_0%,rgb(255_244_220/0.16),transparent)] opacity-70 transition-opacity duration-500 ease-out group-hover:opacity-100"
          />
        </div>
      </ArchFrame>
      {/* the sill: a ruled stone ledge a little wider than the window */}
      <div
        aria-hidden="true"
        className="-mx-2 h-2.5 border-y border-line-firm bg-[repeating-linear-gradient(90deg,transparent_0_6px,var(--line)_6px_7px)] sm:-mx-3.5"
      />
      <span className="mt-3 block serif-italic text-[15px] leading-tight sm:mt-3.5 sm:text-[17px]">
        {/* the last word keeps the arrow with it when a narrow window wraps the caption */}
        <span aria-hidden="true">
          {captionHead}
          <span className="whitespace-nowrap">
            {captionTail}
            <Arrow className="ms-2 -translate-y-px transition-transform group-hover:translate-x-1 group-focus-visible:translate-x-1" />
          </span>
        </span>
        <span className="sr-only"> A live piece from the lab; opens its page.</span>
      </span>
    </Link>
  );
}

// The static stand-ins under the canvas: the same bands as the poster's
// palettes, horizon at 65.5%.
const DUSK_SKY =
  "linear-gradient(180deg, #1b1e4a 0%, #2a2c68 14%, #463676 26%, #744073 38%, #ad536a 47%, #d86f50 55%, #eca057 60%, #f6cb7e 64%, #fdebc2 65.5%, #4d4683 65.5%, #272d69 76%, #151b46 88%, #0f1439 100%)";
const NIGHT_SKY =
  "linear-gradient(180deg, #05071a 0%, #0d1131 22%, #19214f 44%, #2f3a74 58%, #56609a 65.5%, #1b2350 65.5%, #10163a 78%, #060a1f 100%)";

/* ---------------------------------------------------------------------- */
/* the poster: Casablanca at dusk, dithered                                */
/* ---------------------------------------------------------------------- */

type RGB = [number, number, number];
const hex = (value: string): RGB => [
  parseInt(value.slice(1, 3), 16),
  parseInt(value.slice(3, 5), 16),
  parseInt(value.slice(5, 7), 16),
];

const DUSK = {
  sky: ["#1b1e4a", "#2a2c68", "#463676", "#744073", "#ad536a", "#d86f50", "#eca057", "#f6cb7e", "#fdebc2"].map(hex),
  sea: ["#4d4683", "#363a7a", "#272d69", "#1d2457", "#151b46", "#0f1439"].map(hex),
  glint: ["#fdebc2", "#f6cb7e", "#eca057"].map(hex),
  land: hex("#12153a"),
  lit: hex("#f6cb7e"),
};
const NIGHT = {
  sky: ["#05071a", "#090c25", "#0d1131", "#12183f", "#19214f", "#222c62", "#2f3a74", "#3f4a86", "#56609a"].map(hex),
  sea: ["#1b2350", "#151c44", "#10163a", "#0c1130", "#090d27", "#060a1f"].map(hex),
  glint: ["#f2e9d8", "#c9c3d8", "#7d86b8"].map(hex),
  land: hex("#04061a"),
  lit: hex("#e9b85c"),
};
const MOON = ["#f2e9d8", "#c9c3d8"].map(hex);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((n) => (n + 0.5) / 16);
const HORIZON = 0.655;

function hash(x: number, y: number): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function noise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** The land as a top edge per column (in scene rows). Built once per size. */
function buildLand(w: number, h: number) {
  const top = new Float32Array(w).fill(Infinity);
  const horizon = h * HORIZON;
  const set = (u0: number, u1: number, v: number) => {
    for (let x = Math.floor(u0 * w); x < Math.ceil(u1 * w); x++) if (x >= 0 && x < w) top[x] = Math.min(top[x], v * h);
  };
  // the promontory and the great hall
  set(0, 0.46, HORIZON - 0.016);
  set(0.08, 0.42, HORIZON - 0.04);
  set(0.17, 0.36, HORIZON - 0.056);
  // the minaret, its lantern and the spire
  set(0.262, 0.302, 0.19);
  set(0.258, 0.306, 0.205);
  set(0.27, 0.294, 0.15);
  set(0.279, 0.285, 0.118);
  // the city to the east: low blocks and two towers
  let x = Math.floor(0.68 * w);
  let seed = 11;
  while (x < w) {
    const width = 3 + Math.floor(hash(seed, 1) * 6);
    const height = HORIZON - 0.03 - hash(seed, 2) * 0.06;
    for (let i = x; i < Math.min(w, x + width); i++) top[i] = Math.min(top[i], height * h);
    x += width;
    seed++;
  }
  set(0.745, 0.77, 0.47);
  set(0.785, 0.81, 0.47);
  set(0.75, 0.765, 0.45);
  set(0.79, 0.805, 0.45);
  return { top, horizon };
}

type Land = ReturnType<typeof buildLand>;

function paint(image: ImageData, land: Land, t: number, lean: number, night: boolean) {
  const { width: w, height: h, data } = image;
  const pal = night ? NIGHT : DUSK;
  const horizon = land.horizon;
  const sunU = (night ? 0.64 : 0.58) + lean * 0.08;
  const sunV = night ? 0.2 : 0.585;
  const sunX = sunU * w;
  const sunY = sunV * h;
  const sunR = (night ? 0.045 : 0.1) * w;
  const skyMax = pal.sky.length - 1;
  const seaMax = pal.sea.length - 1;

  // gulls (dusk only): three small wing-beats crossing slowly
  const gulls: Array<[number, number, number]> = [];
  if (!night) {
    for (let i = 0; i < 3; i++) {
      const gx = ((0.45 + t * 0.006 + i * 0.23) % 1.2) - 0.1;
      const gy = 0.27 + i * 0.055 + Math.sin(t * 0.7 + i * 2) * 0.01;
      gulls.push([Math.round(gx * w), Math.round(gy * h), Math.sin(t * 5 + i * 1.7) > 0 ? 1 : 0]);
    }
  }

  let o = 0;
  for (let y = 0; y < h; y++) {
    const v = y / h;
    for (let x = 0; x < w; x++, o += 4) {
      const threshold = BAYER[(y & 3) * 4 + (x & 3)];
      let color: RGB;
      const dx = x - sunX;
      const dy = y - sunY;
      const dist = Math.sqrt(dx * dx + dy * dy) / w;

      if (y >= land.top[x] && y < horizon + 2 + (x < w * 0.42 ? 3 : 0)) {
        // land, with lit openings along the hall and the towers at night
        color = pal.land;
        const hallRow = y > horizon - 0.034 * h && y < horizon - 0.018 * h;
        const hallSpan = x > w * 0.09 && x < w * 0.41;
        // the minaret's carved panels catch the last light
        const panel =
          x > w * 0.266 &&
          x < w * 0.298 &&
          (Math.floor(y / 2) % 9 === 0 || Math.floor(y / 2) % 9 === 4) &&
          y > 0.22 * h &&
          y < 0.55 * h;
        if (night) {
          const openings =
            (hallRow && hallSpan && x % 3 === 0) || (x > w * 0.68 && y % 3 === 1 && x % 2 === 0 && hash(x, y) > 0.55);
          if (openings) color = pal.lit;
          if (x >= w * 0.27 && x < w * 0.294 && y >= 0.15 * h && y < 0.15 * h + 3) color = pal.lit;
        } else if ((hallRow && hallSpan && x % 3 === 0) || (panel && threshold > 0.35)) {
          color = pal.sea[0];
        }
      } else if (y < horizon) {
        // the sky
        const g = v / HORIZON;
        let s = 0.15 + Math.pow(g, 1.35) * (night ? 5.6 : 6.1);
        const glowNear = Math.exp(-((dist / (night ? 0.12 : 0.2)) ** 2));
        const glowFar = Math.exp(-((dist / 0.55) ** 2));
        s += glowNear * (night ? 1.6 : 2.3) + glowFar * (night ? 0.5 : 0.9);
        // clouds: long, thin, drifting bands
        const band = Math.exp(-(((v - 0.36) / 0.09) ** 2)) + 0.6 * Math.exp(-(((v - 0.5) / 0.04) ** 2));
        const cloud = Math.max(0, noise((x / w) * 3.2 + t * 0.012, v * 16) - 0.48) * 2.6 * band;
        s -= cloud * (night ? 1.1 : 1.8);
        s += cloud * glowNear * 2.6;
        // stars at night
        if (night && v < 0.5) {
          const sparkle = hash(x, y);
          if (sparkle > 0.992) {
            const twinkle = 0.5 + 0.5 * Math.sin(t * 1.4 + sparkle * 900);
            if (twinkle > threshold * 0.8) s = skyMax;
          }
        }
        if (dist * w < sunR) s = skyMax - 0.4 + (1 - (dist * w) / sunR) * 0.6;
        s = Math.min(skyMax, Math.max(0, s));
        const i = Math.floor(s);
        color = s - i > threshold && i < skyMax ? pal.sky[i + 1] : pal.sky[i];
        if (night) {
          // the moon, shaded on one side
          if (dist * w < sunR) {
            const shade = (dx / sunR + 1) * 0.5;
            color = shade * 0.9 > threshold ? MOON[1] : MOON[0];
          }
          // a thin beam from the lantern, out toward the east
          const bx = (x - w * 0.29) / w;
          const by = (0.15 * h - y) / w;
          if (bx > 0 && Math.abs(by - bx * 0.42) < 0.006 + bx * 0.012) {
            const strength = Math.max(0, 0.75 - bx * 1.1);
            if (strength > threshold) color = pal.glint[2];
          }
        }
      } else {
        // the Atlantic
        const depth = (y - horizon) / (h - horizon);
        let s = Math.pow(depth, 0.75) * seaMax;
        const swell = Math.sin(y * 1.3 + t * 0.9 + noise(x * 0.08, y * 0.4) * 5);
        if (swell > 0.86) s -= 0.9;
        s = Math.min(seaMax, Math.max(0, s));
        const i = Math.floor(s);
        color = s - i > threshold && i < seaMax ? pal.sea[i + 1] : pal.sea[i];
        // the sun's (or the moon's) road on the water
        const spread = (night ? 0.02 : 0.035) + depth * (night ? 0.12 : 0.24);
        const road = Math.exp(-(((x / w - sunU) / spread) ** 2));
        const shimmer = 0.5 + 0.5 * Math.sin(y * 2.1 + t * 1.7 + noise(x * 0.35 + t * 0.4, y * 0.6) * 7);
        const glint = road * shimmer * (night ? 0.95 : 1.25) * (1 - depth * 0.35);
        if (glint > threshold) color = pal.glint[Math.min(2, Math.floor(depth * 3 + (1 - shimmer) * 0.8))];
      }

      data[o] = color[0];
      data[o + 1] = color[1];
      data[o + 2] = color[2];
      data[o + 3] = 255;
    }
  }

  // gulls over the sky
  for (const [gx, gy, flap] of gulls) {
    const points = flap
      ? [[-2, -1], [-1, 0], [0, 1], [1, 0], [2, -1]]
      : [[-2, 0], [-1, -1], [0, 0], [1, -1], [2, 0]];
    for (const [px, py] of points) {
      const x = gx + px;
      const y = gy + py;
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      const k = (y * w + x) * 4;
      data[k] = pal.land[0];
      data[k + 1] = pal.land[1];
      data[k + 2] = pal.land[2];
    }
  }
}

/** The code-drawn poster for the dusk piece. Fills the window. */
export function DuskPoster() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();
  const reduced = useReducedMotion();
  const active = useContext(PosterActive);
  const lean = useRef({ value: 0, target: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let image: ImageData | null = null;
    let land: Land | null = null;
    // read the class itself: the theme hook's server value may lag a frame
    const night = document.documentElement.classList.contains("dark");
    const animate = active && !reduced;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      // 3 CSS px per scene pixel; 2 on a small (phone) window, for detail
      const px = rect.width < 240 ? 2 : 3;
      const w = Math.max(40, Math.round(rect.width / px));
      const h = Math.max(50, Math.round(rect.height / px));
      if (canvas.width !== w || canvas.height !== h || !image) {
        canvas.width = w;
        canvas.height = h;
        image = ctx.createImageData(w, h);
        land = buildLand(w, h);
      }
    };

    const start = performance.now();
    const clock = () => (animate ? (performance.now() - start) / 1000 + 4 : 4);
    const draw = (t: number) => {
      if (!image || !land) return;
      paint(image, land, t, lean.current.value, night);
      ctx.putImageData(image, 0, 0);
      canvas.dataset.ready = "";
    };

    resize();
    draw(clock());

    const observer = new ResizeObserver(() => {
      resize();
      draw(clock());
    });
    observer.observe(host);

    // the sun leans toward the pointer
    const onMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      lean.current.target = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
      if (!animate) {
        lean.current.value = lean.current.target;
        draw(clock());
      }
    };
    const onLeave = () => {
      lean.current.target = 0;
      if (!animate) {
        lean.current.value = 0;
        draw(clock());
      }
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);

    let raf = 0;
    let last = 0;
    if (animate) {
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        if (now - last < 48) return; // ~20 fps: a steady, slow pulse suits the dither
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        lean.current.value += (lean.current.target - lean.current.value) * (1 - Math.exp(-3 * dt));
        draw(clock());
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [theme, reduced, active]);

  return (
    <div aria-hidden="true" className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full opacity-0 transition-opacity duration-900 ease-out [image-rendering:pixelated] data-ready:opacity-100 motion-reduce:transition-none"
      />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* in-page links                                                           */
/* ---------------------------------------------------------------------- */

/**
 * A link to a section of this page that glides there (cuts under reduced
 * motion) and hands focus to the section's heading (`{to}-title`), the way
 * the top bar's section links do. Without script it is a plain #anchor.
 */
export function JumpLink({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const target = document.getElementById(to);
    if (!target) return;
    event.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    history.replaceState(history.state, "", `#${to}`);
    const heading = document.getElementById(`${to}-title`) ?? target;
    if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  };
  return (
    <a href={`#${to}`} onClick={onClick} className={className}>
      {children}
    </a>
  );
}
