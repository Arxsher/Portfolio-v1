"use client";

// The orchestration graph for a parallel step: the lead agent on the left,
// its sub-agents in a column, a merge node on the right, joined by cubic
// Bézier edges. Packets (a bright head with a short fading tail) travel
// the edges: one dispatch packet per sub-agent when it is handed its part,
// a slow stream while it works, and a result packet to the merge node when
// it is done. Nodes and edge colours are React (they change at discrete
// moments); the packets are written into a small pool of SVG groups every
// frame by a clock subscriber, so the graph never re-renders to move them.

import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/cn";
import { useElementSize } from "../../hooks";
import type { RunClock } from "./clock";
import { AgentMark, GlyphShape, Spinner, StatusIcon } from "./parts";
import { statusAt, type TAgent, type TStep } from "./script";

type Point = { x: number; y: number };
type Curve = [Point, Point, Point, Point];

function bezier([p0, p1, p2, p3]: Curve, u: number): Point {
  const v = 1 - u;
  const a = v * v * v;
  const b = 3 * v * v * u;
  const c = 3 * v * u * u;
  const d = u * u * u;
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
}

function curve(from: Point, to: Point): Curve {
  const dx = (to.x - from.x) * 0.56;
  return [from, { x: from.x + dx, y: from.y }, { x: to.x - dx, y: to.y }, to];
}

const pathOf = ([p0, p1, p2, p3]: Curve) =>
  `M${p0.x.toFixed(2)} ${p0.y.toFixed(2)}C${p1.x.toFixed(2)} ${p1.y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`;

const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

type Size = "stage" | "tile";

const LAYOUT: Record<Size | "narrow", { height: number; r: number; pillH: number; gap: number; pad: number; edge: number; maxPill: number }> = {
  stage: { height: 124, r: 15, pillH: 28, gap: 9, pad: 10, edge: 34, maxPill: 196 },
  /** The stage graph on a phone: smaller ends, shorter edges, room for the names. */
  narrow: { height: 120, r: 13, pillH: 28, gap: 8, pad: 4, edge: 22, maxPill: 196 },
  tile: { height: 52, r: 8, pillH: 13, gap: 4, pad: 1, edge: 18, maxPill: 70 },
};

const POOL = 9;
/** Tail: offsets behind the head (in curve parameter), radius and opacity. */
const TAIL = [
  [0, 1, 1],
  [0.035, 0.78, 0.55],
  [0.07, 0.6, 0.32],
  [0.105, 0.45, 0.16],
] as const;

export function Graph({
  step,
  t,
  stopped,
  clock,
  size = "stage",
  reducedMotion,
}: {
  step: TStep;
  t: number;
  stopped: boolean;
  clock: RunClock;
  size?: Size;
  reducedMotion: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(hostRef);
  const L = LAYOUT[size === "stage" && width > 0 && width < 380 ? "narrow" : size];
  const agents = step.agents;
  const n = agents.length;

  const geometry = useMemo(() => {
    if (!width) return null;
    const cy = L.height / 2;
    const lead = { x: L.pad + L.r, y: cy };
    const merge = { x: width - L.pad - L.r, y: cy };
    const room = width - 2 * (L.pad + 2 * L.r + L.edge);
    const pillW = Math.max(40, Math.min(L.maxPill, room));
    const pillX = (width - pillW) / 2;
    const pills = agents.map((_, index) => {
      const y = cy + (index - (n - 1) / 2) * (L.pillH + L.gap);
      return { x: pillX, y: y - L.pillH / 2, w: pillW, h: L.pillH, cy: y };
    });
    const gap = size === "stage" ? 3 : 2;
    const inbound = pills.map((pill) => curve({ x: lead.x + L.r + gap, y: lead.y }, { x: pill.x - gap, y: pill.cy }));
    const outbound = pills.map((pill) => curve({ x: pill.x + pill.w + gap, y: pill.cy }, { x: merge.x - L.r - gap, y: merge.y }));
    return { lead, merge, pills, inbound, outbound };
  }, [width, agents, n, L, size]);

  // Packets, every frame.
  const packetRefs = useRef<Array<SVGGElement | null>>([]);
  const geometryRef = useRef(geometry);
  useEffect(() => {
    geometryRef.current = geometry;
  });
  useEffect(() => {
    const hideAll = () => packetRefs.current.forEach((node) => node && node.setAttribute("opacity", "0"));
    if (reducedMotion) {
      hideAll();
      return;
    }
    const draw = (time: number, live: boolean) => {
      const g = geometryRef.current;
      if (!g) return;
      let slot = 0;
      const place = (path: Curve, u: number, strength: number) => {
        const node = packetRefs.current[slot++];
        if (!node) return;
        node.setAttribute("opacity", strength.toFixed(3));
        const circles = node.children;
        TAIL.forEach(([back], index) => {
          const point = bezier(path, Math.max(0, Math.min(1, u - back)));
          const circle = circles[index] as SVGCircleElement | undefined;
          if (circle) {
            circle.setAttribute("cx", point.x.toFixed(2));
            circle.setAttribute("cy", point.y.toFixed(2));
          }
        });
        const glow = circles[TAIL.length] as SVGCircleElement | undefined;
        if (glow) {
          const head = bezier(path, Math.max(0, Math.min(1, u)));
          glow.setAttribute("cx", head.x.toFixed(2));
          glow.setAttribute("cy", head.y.toFixed(2));
        }
      };
      if (live) {
        step.agents.forEach((agent: TAgent, index) => {
          const inbound = g.inbound[index];
          const outbound = g.outbound[index];
          if (!inbound || !outbound) return;
          // Dispatch: the lead hands over the work.
          if (time >= agent.sent && time < agent.start) {
            place(inbound, easeInOut((time - agent.sent) / (agent.start - agent.sent)), 1);
          }
          // While it works: a slow stream of context along the same edge.
          if (time >= agent.start && time < agent.end) {
            const period = size === "stage" ? 1.05 : 0.8;
            const phase = ((time - agent.start + index * 0.31) % period) / period;
            const u = easeInOut(Math.min(1, phase / 0.8));
            if (phase < 0.86) place(inbound, u, 0.55);
          }
          // The result travels on to the merge node.
          if (time >= agent.end && time < agent.back) {
            place(outbound, easeInOut((time - agent.end) / (agent.back - agent.end)), 1);
          }
        });
      }
      for (; slot < POOL; slot++) packetRefs.current[slot]?.setAttribute("opacity", "0");
    };
    draw(clock.t, clock.state === "running");
    return clock.subscribe((_, c) => {
      draw(c.t, c.state === "running" && c.t >= step.start && c.t < step.end + 0.1);
    });
  }, [clock, step, reducedMotion, size]);

  const merged = t >= step.merged;
  const leadLive = !stopped && t >= step.start && t < step.merged;

  return (
    <div ref={hostRef} className="relative w-full" style={{ height: L.height }} aria-hidden="true">
      {geometry ? (
        <>
          <svg className="absolute inset-0 overflow-visible" width={width} height={L.height}>
            {agents.map((agent, index) => {
              const inState = t < agent.sent ? "pending" : t < agent.end ? (stopped ? "stopped" : "live") : "done";
              const outState = t < agent.end ? "pending" : t < agent.back ? (stopped ? "stopped" : "live") : "done";
              return (
                <g key={agent.id}>
                  <path d={pathOf(geometry.inbound[index])} className="ar-edge" data-state={inState} />
                  <path d={pathOf(geometry.outbound[index])} className="ar-edge" data-state={outState} />
                </g>
              );
            })}
            {Array.from({ length: POOL }, (_, index) => (
              <g
                key={index}
                ref={(node) => {
                  packetRefs.current[index] = node;
                }}
                opacity="0"
                className="ar-packet"
              >
                {TAIL.map(([, radius, alpha], tailIndex) => (
                  <circle key={tailIndex} r={(size === "stage" ? 2.6 : 1.5) * radius} opacity={alpha} />
                ))}
                <circle r={size === "stage" ? 7 : 4} className="ar-packet-glow" />
              </g>
            ))}
          </svg>

          {/* lead */}
          <div
            className="absolute grid place-items-center"
            style={{ left: geometry.lead.x - L.r, top: geometry.lead.y - L.r, width: L.r * 2, height: L.r * 2 }}
          >
            {leadLive && size === "stage" ? <span className="ar-halo absolute inset-0 rounded-full" /> : null}
            <AgentMark size={L.r * 2} live={leadLive} />
          </div>

          {/* sub-agents */}
          {agents.map((agent, index) => {
            const pill = geometry.pills[index];
            const status = statusAt(agent.start, agent.end, t, stopped);
            const sent = t >= agent.sent;
            return (
              <div
                key={agent.id}
                className={cn("ar-pill absolute flex items-center", size === "stage" ? "gap-2 ps-2.5 pe-2" : "gap-[3px] ps-[4px] pe-[3px]")}
                data-state={!sent ? "queued" : status}
                data-size={size}
                style={{ left: pill.x, top: pill.y, width: pill.w, height: pill.h }}
              >
                <GlyphShape glyph={agent.spec.glyph} size={size === "stage" ? 8 : 5} className="ar-pill-glyph" />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate leading-none",
                    size === "stage" ? "text-[12px]" : "text-[7.5px]",
                    status === "pending" ? "text-tertiary" : "text-primary",
                  )}
                >
                  {agent.spec.name}
                </span>
                {status === "running" ? (
                  <Spinner size={size === "stage" ? 12 : 7} className="text-[var(--ar-live)]" />
                ) : status === "done" || status === "stopped" ? (
                  <StatusIcon status={status} size={size === "stage" ? 12 : 7} />
                ) : null}
              </div>
            );
          })}

          {/* merge */}
          <div
            className="absolute grid place-items-center"
            style={{ left: geometry.merge.x - L.r, top: geometry.merge.y - L.r, width: L.r * 2, height: L.r * 2 }}
          >
            <span
              className={cn(
                "absolute inset-0 rounded-full transition-[background-color,box-shadow] duration-300 ease-out",
                merged ? "bg-ink" : "bg-float shadow-[inset_0_0_0_1px_var(--line-dash)]",
              )}
            />
            {merged ? (
              <svg viewBox="0 0 16 16" width={L.r * 1.15} height={L.r * 1.15} className="ar-pop relative text-on-ink">
                <path
                  d="m4 8.3 2.6 2.6L12 5.4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ar-draw"
                  style={{ ["--len" as string]: 12 }}
                />
              </svg>
            ) : (
              <span className="relative size-[30%] rounded-full bg-line-dash" />
            )}
          </div>

          {size === "stage" ? (
            <>
              <span
                className="absolute text-[10.5px] leading-none text-tertiary"
                style={{ left: geometry.lead.x, top: geometry.lead.y + L.r + 8, translate: "-50% 0" }}
              >
                lead
              </span>
              <span
                className="absolute text-[10.5px] leading-none text-tertiary"
                style={{ left: geometry.merge.x, top: geometry.merge.y + L.r + 8, translate: "-50% 0" }}
              >
                merge
              </span>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
