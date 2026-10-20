"use client";

// The orchestration graph for a parallel step: the lead agent on the left,
// its sub-agents in a column, a merge node on the right, joined by cubic
// Bézier edges.
//
// Light and motion carry the story. While the lead hands out work a soft
// glow breathes under it; a live edge carries a faint flowing current, and
// packets ride the curves: a bright head with a comet tail of fixed length
// (a stroked slice of the edge itself, faded by a gradient that follows the
// head), one dispatch packet per sub-agent, a slow stream while it works and
// a result packet on to the merge node. A running sub-agent wears a light
// that sweeps round its border, from ink into the accent. When the last
// result lands the merge node fills, a ring opens out of it and every edge
// flashes ink once before settling to grey.
//
// Nodes and edge states are React (they change at discrete moments). The
// packets are written into a fixed pool of SVG elements every frame by a
// clock subscriber, with no allocation in the loop: arc-length tables are
// built once per layout, points are written into scratch arrays, and an
// attribute is only touched when its rounded value changes.

import { useEffect, useId, useMemo, useRef } from "react";
import { cn } from "@/lib/cn";
import { useElementSize } from "../../hooks";
import type { RunClock } from "./clock";
import { AgentMark, GlyphShape, StatusIcon } from "./parts";
import { agentActivity, formatSeconds, statusAt, type Status, type TAgent, type TStep } from "./script";

/** wide: the stage on a laptop (two-line nodes); narrow: the stage on a phone; tile: the miniature. */
export type GraphVariant = "wide" | "narrow" | "tile";

type Layout = {
  /** Radius of the lead and merge discs. */
  r: number;
  nodeH: number;
  gap: number;
  /** Space above and below the column of nodes. */
  vpad: number;
  /** Space left and right of the end discs. */
  pad: number;
  /** Shortest an edge may get before the nodes give up width. */
  edge: number;
  minNode: number;
  maxNode: number;
  /** Packets: tail length (px), head radius, glow radius, trail width. */
  tail: number;
  head: number;
  glow: number;
  trail: number;
  /** Seconds per packet of the working stream. */
  period: number;
};

const LAYOUT: Record<GraphVariant, Layout> = {
  wide: { r: 16, nodeH: 44, gap: 9, vpad: 5, pad: 12, edge: 64, minNode: 188, maxNode: 236, tail: 26, head: 2.8, glow: 9, trail: 2.6, period: 1.1 },
  narrow: { r: 13, nodeH: 30, gap: 9, vpad: 8, pad: 3, edge: 38, minNode: 104, maxNode: 136, tail: 18, head: 2.5, glow: 7, trail: 2.2, period: 1.05 },
  tile: { r: 8, nodeH: 12.5, gap: 3.5, vpad: 0.5, pad: 1, edge: 15, minNode: 48, maxNode: 72, tail: 8, head: 1.5, glow: 4, trail: 1.3, period: 0.8 },
};

export const graphHeight = (variant: GraphVariant, agents: number) => {
  const L = LAYOUT[variant];
  return agents * L.nodeH + Math.max(0, agents - 1) * L.gap + 2 * L.vpad + (variant === "tile" ? 0 : 6);
};

/** "2,650" → "2.7k" */
export const kilo = (tokens: number) => (tokens >= 1000 ? `${(tokens / 1000).toFixed(1)}k` : String(tokens));

/* ---------------------------------------------------------------------- */
/* curves                                                                  */
/* ---------------------------------------------------------------------- */

const SAMPLES = 32;

type Edge = {
  /** p0 … p3 as x, y pairs. */
  c: Float64Array;
  /** Arc length at SAMPLES + 1 evenly spaced parameters. */
  lut: Float64Array;
  length: number;
  d: string;
};

/** Writes the point at parameter u into out[0], out[1]. */
function pointInto(out: Float64Array, c: Float64Array, u: number) {
  const v = 1 - u;
  const a = v * v * v;
  const b = 3 * v * v * u;
  const k = 3 * v * u * u;
  const d = u * u * u;
  out[0] = a * c[0] + b * c[2] + k * c[4] + d * c[6];
  out[1] = a * c[1] + b * c[3] + k * c[5] + d * c[7];
}

const HEAD = new Float64Array(2);
const TAIL = new Float64Array(2);

function makeEdge(x0: number, y0: number, x3: number, y3: number): Edge {
  const dx = (x3 - x0) * 0.56;
  const c = new Float64Array([x0, y0, x0 + dx, y0, x3 - dx, y3, x3, y3]);
  const lut = new Float64Array(SAMPLES + 1);
  let px = x0;
  let py = y0;
  for (let i = 1; i <= SAMPLES; i++) {
    pointInto(HEAD, c, i / SAMPLES);
    lut[i] = lut[i - 1] + Math.hypot(HEAD[0] - px, HEAD[1] - py);
    px = HEAD[0];
    py = HEAD[1];
  }
  const f = (value: number) => String(Math.round(value * 100) / 100);
  return { c, lut, length: lut[SAMPLES], d: `M${f(c[0])} ${f(c[1])}C${f(c[2])} ${f(c[3])} ${f(c[4])} ${f(c[5])} ${f(c[6])} ${f(c[7])}` };
}

/** Arc length from the start of the edge to parameter u. */
function lengthAt(edge: Edge, u: number): number {
  const x = Math.min(SAMPLES, Math.max(0, u * SAMPLES));
  const i = Math.min(SAMPLES - 1, Math.floor(x));
  return edge.lut[i] + (edge.lut[i + 1] - edge.lut[i]) * (x - i);
}

/** The parameter at arc length s. */
function paramAt(edge: Edge, s: number): number {
  if (s <= 0) return 0;
  if (s >= edge.length) return 1;
  let lo = 0;
  let hi = SAMPLES;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (edge.lut[mid] < s) lo = mid;
    else hi = mid;
  }
  const span = edge.lut[hi] - edge.lut[lo];
  return (lo + (span > 0 ? (s - edge.lut[lo]) / span : 0)) / SAMPLES;
}

const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const round1 = (value: number) => Math.round(value * 10) / 10;

/* ---------------------------------------------------------------------- */
/* packets                                                                 */
/* ---------------------------------------------------------------------- */

const POOL = 9;

/** What a pool slot last wrote (indices into Slot.last), so the DOM is only touched on change. */
const W = { Opacity: 0, HeadX: 1, HeadY: 2, TailX: 3, TailY: 4, Dash: 5, Offset: 6, Size: 7 } as const;

type Slot = {
  group: SVGGElement;
  trail: SVGPathElement;
  grad: SVGLinearGradientElement;
  head: SVGCircleElement;
  glow: SVGCircleElement;
  edge: number;
  last: Float64Array;
};

function hide(slot: Slot) {
  if (slot.last[W.Opacity] === 0) return;
  slot.last[W.Opacity] = 0;
  slot.group.setAttribute("opacity", "0");
}

/** Puts a packet on `edge` at parameter u (0..1). */
function place(slot: Slot, edge: Edge, index: number, u: number, strength: number, tail: number) {
  const last = slot.last;
  if (slot.edge !== index) {
    slot.edge = index;
    slot.trail.setAttribute("d", edge.d);
    last[W.Dash] = NaN;
  }
  const s = lengthAt(edge, u);
  const s0 = Math.max(0, s - tail);
  pointInto(HEAD, edge.c, u);
  pointInto(TAIL, edge.c, paramAt(edge, s0));

  // Fade in as it leaves, out as it arrives.
  const opacity = Math.round(strength * Math.max(0, Math.min(1, u / 0.06, (1 - u) / 0.1)) * 100) / 100;
  if (opacity !== last[W.Opacity]) {
    last[W.Opacity] = opacity;
    slot.group.setAttribute("opacity", String(opacity));
  }
  const hx = round1(HEAD[0]);
  const hy = round1(HEAD[1]);
  if (hx !== last[W.HeadX] || hy !== last[W.HeadY]) {
    last[W.HeadX] = hx;
    last[W.HeadY] = hy;
    const x = String(hx);
    const y = String(hy);
    slot.head.setAttribute("cx", x);
    slot.head.setAttribute("cy", y);
    slot.glow.setAttribute("cx", x);
    slot.glow.setAttribute("cy", y);
    slot.grad.setAttribute("x2", x);
    slot.grad.setAttribute("y2", y);
  }
  const tx = round1(TAIL[0]);
  const ty = round1(TAIL[1]);
  if (tx !== last[W.TailX] || ty !== last[W.TailY]) {
    last[W.TailX] = tx;
    last[W.TailY] = ty;
    slot.grad.setAttribute("x1", String(tx));
    slot.grad.setAttribute("y1", String(ty));
  }
  // The trail is a dash of the edge itself, from s0 to s.
  const dash = round1(s - s0);
  if (dash !== last[W.Dash]) {
    last[W.Dash] = dash;
    slot.trail.setAttribute("stroke-dasharray", `${dash} ${Math.ceil(edge.length + tail)}`);
  }
  const offset = round1(-s0);
  if (offset !== last[W.Offset]) {
    last[W.Offset] = offset;
    slot.trail.setAttribute("stroke-dashoffset", String(offset));
  }
}

type Geometry = {
  width: number;
  height: number;
  cy: number;
  lead: { x: number; y: number };
  merge: { x: number; y: number };
  nodes: Array<{ x: number; y: number; w: number; h: number; cy: number }>;
  /** Inbound edges first (lead → node i), then outbound (node i → merge). */
  edges: Edge[];
};

/** Writes this frame's packets for a step into the pool. */
function drawPackets(slots: Slot[], g: Geometry, step: TStep, time: number, live: boolean, L: Layout) {
  let used = 0;
  if (live) {
    const n = step.agents.length;
    for (let index = 0; index < n && used < slots.length; index++) {
      const agent: TAgent = step.agents[index];
      const inbound = g.edges[index];
      const outbound = g.edges[n + index];
      if (!inbound || !outbound) continue;
      // Dispatch: the lead hands over the work.
      if (time >= agent.sent && time < agent.start) {
        place(slots[used++], inbound, index, easeInOut((time - agent.sent) / (agent.start - agent.sent)), 1, L.tail);
      }
      // While it works: a slow stream of context along the same edge.
      if (time >= agent.start && time < agent.end && used < slots.length) {
        const phase = ((time - agent.start + index * 0.31) % L.period) / L.period;
        if (phase < 0.86) place(slots[used++], inbound, index, easeInOut(Math.min(1, phase / 0.8)), 0.6, L.tail * 0.75);
      }
      // The result travels on to the merge node.
      if (time >= agent.end && time < agent.back && used < slots.length) {
        place(slots[used++], outbound, n + index, easeInOut((time - agent.end) / (agent.back - agent.end)), 1, L.tail);
      }
    }
  }
  for (let index = used; index < slots.length; index++) hide(slots[index]);
}

/* ---------------------------------------------------------------------- */
/* graph                                                                   */
/* ---------------------------------------------------------------------- */

export function Graph({
  step,
  t,
  stopped,
  clock,
  variant,
  bare = false,
  reducedMotion,
}: {
  step: TStep;
  t: number;
  stopped: boolean;
  clock: RunClock;
  variant: GraphVariant;
  /** Tile only: each sub-agent as its glyph and a bar instead of its name (phone-sized tiles). */
  bare?: boolean;
  reducedMotion: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(hostRef);
  const L = LAYOUT[variant];
  const agents = step.agents;
  const n = agents.length;
  const height = graphHeight(variant, n);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const geometry = useMemo<Geometry | null>(() => {
    if (!width) return null;
    const columnH = n * L.nodeH + Math.max(0, n - 1) * L.gap;
    const cy = L.vpad + columnH / 2;
    const lead = { x: L.pad + L.r, y: cy };
    const merge = { x: width - L.pad - L.r, y: cy };
    const room = width - 2 * (L.pad + 2 * L.r + L.edge);
    const w = Math.round(Math.max(L.minNode, Math.min(L.maxNode, room)));
    const x = Math.round((width - w) / 2);
    const nodes = agents.map((_, index) => {
      const top = L.vpad + index * (L.nodeH + L.gap);
      return { x, y: top, w, h: L.nodeH, cy: top + L.nodeH / 2 };
    });
    const gap = variant === "tile" ? 2 : 3;
    const edges = [
      ...nodes.map((node) => makeEdge(lead.x + L.r + gap, lead.y, node.x - gap, node.cy)),
      ...nodes.map((node) => makeEdge(node.x + node.w + gap, node.cy, merge.x - L.r - gap, merge.y)),
    ];
    return { width, height, cy, lead, merge, nodes, edges };
  }, [width, height, agents, n, L, variant]);

  // Packets, every frame.
  const groupRefs = useRef<Array<SVGGElement | null>>([]);
  const gradRefs = useRef<Array<SVGLinearGradientElement | null>>([]);
  useEffect(() => {
    if (!geometry) return;
    const slots: Slot[] = [];
    for (let index = 0; index < POOL; index++) {
      const group = groupRefs.current[index];
      const grad = gradRefs.current[index];
      if (!group || !grad) continue;
      const [trail, glow, head] = Array.from(group.children) as [SVGPathElement, SVGCircleElement, SVGCircleElement];
      const last = new Float64Array(W.Size).fill(NaN);
      slots.push({ group, trail, grad, head, glow, edge: -1, last });
    }
    if (reducedMotion) {
      slots.forEach(hide);
      return;
    }
    const isLive = (c: RunClock) => c.state === "running" && c.t >= step.start && c.t < step.end + 0.1;
    drawPackets(slots, geometry, step, clock.t, isLive(clock), L);
    return clock.subscribe((_, c) => {
      drawPackets(slots, geometry, step, c.t, isLive(c), L);
    });
  }, [clock, step, reducedMotion, geometry, L]);

  const merged = t >= step.merged;
  const leadLive = !stopped && t >= step.start && t < step.merged;
  const tile = variant === "tile";

  return (
    <div
      ref={hostRef}
      className="ar-graph relative w-full"
      data-variant={variant}
      data-merged={merged ? "" : undefined}
      style={{ height }}
      aria-hidden="true"
    >
      {geometry ? (
        <>
          {tile ? null : (
            <span
              className="ar-lead-glow"
              data-on={leadLive ? "" : undefined}
              style={{ left: geometry.lead.x, top: geometry.lead.y, width: L.r * 8, height: L.r * 8 }}
            />
          )}
          <svg className="absolute inset-0 overflow-visible" width={width} height={height}>
            <defs>
              {Array.from({ length: POOL }, (_, index) => (
                <linearGradient
                  key={index}
                  id={`${uid}-p${index}`}
                  gradientUnits="userSpaceOnUse"
                  ref={(node) => {
                    gradRefs.current[index] = node;
                  }}
                >
                  <stop offset="0" className="ar-stop" stopOpacity="0" />
                  <stop offset="0.55" className="ar-stop" stopOpacity="0.4" />
                  <stop offset="1" className="ar-stop" stopOpacity="1" />
                </linearGradient>
              ))}
            </defs>
            {agents.map((agent, index) => {
              const inState = t < agent.sent ? "pending" : t < agent.end ? (stopped ? "stopped" : "live") : "done";
              const outState = t < agent.end ? "pending" : t < agent.back ? (stopped ? "stopped" : "live") : "done";
              const inbound = geometry.edges[index];
              const outbound = geometry.edges[n + index];
              return (
                <g key={agent.id}>
                  <path d={inbound.d} className="ar-edge" data-state={inState} />
                  <path d={outbound.d} className="ar-edge" data-state={outState} />
                  {inState === "live" && !reducedMotion ? <path d={inbound.d} className="ar-current" /> : null}
                  {outState === "live" && !reducedMotion ? <path d={outbound.d} className="ar-current" /> : null}
                </g>
              );
            })}
            {Array.from({ length: POOL }, (_, index) => (
              <g
                key={index}
                ref={(node) => {
                  groupRefs.current[index] = node;
                }}
                opacity="0"
              >
                <path className="ar-trail" stroke={`url(#${uid}-p${index})`} strokeWidth={L.trail} />
                <circle r={L.glow} className="ar-packet-glow" />
                <circle r={L.head} className="ar-packet" />
              </g>
            ))}
          </svg>

          {/* lead */}
          <div
            className="absolute grid place-items-center"
            style={{ left: geometry.lead.x - L.r, top: geometry.lead.y - L.r, width: L.r * 2, height: L.r * 2 }}
          >
            {leadLive && !tile ? <span className="ar-halo absolute inset-0 rounded-full" /> : null}
            <AgentMark size={L.r * 2} live={leadLive} className="ar-lead" />
          </div>

          {/* sub-agents */}
          {agents.map((agent, index) => (
            <Node key={agent.id} agent={agent} index={index} box={geometry.nodes[index]} t={t} stopped={stopped} variant={variant} bare={bare && tile} />
          ))}

          {/* merge */}
          <div
            className="absolute grid place-items-center"
            style={{ left: geometry.merge.x - L.r, top: geometry.merge.y - L.r, width: L.r * 2, height: L.r * 2 }}
          >
            {merged && !tile && !reducedMotion ? <span className="ar-merge-ring absolute inset-0 rounded-full" /> : null}
            <span
              className={cn(
                "absolute inset-0 rounded-full transition-[background-color,box-shadow] duration-300 ease-out",
                merged ? "bg-ink shadow-[0_1px_2px_rgb(0_0_0/0.12)]" : "bg-float shadow-[inset_0_0_0_1px_var(--line-dash)]",
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

          {tile ? null : (
            <>
              <span
                className="absolute text-[10.5px] leading-none text-tertiary"
                style={{ left: geometry.lead.x, top: geometry.lead.y + L.r + 7, translate: "-50% 0" }}
              >
                lead
              </span>
              <span
                className="absolute text-[10.5px] leading-none text-tertiary"
                style={{ left: geometry.merge.x, top: geometry.merge.y + L.r + 7, translate: "-50% 0" }}
              >
                merge
              </span>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* nodes                                                                   */
/* ---------------------------------------------------------------------- */

function NodeStatus({ status, size }: { status: Status; size: number }) {
  if (status === "running") return <span className="ar-node-live" style={{ width: size * 0.5, height: size * 0.5 }} />;
  if (status === "done" || status === "stopped") return <StatusIcon status={status} size={size} />;
  return null;
}

/** Bar lengths for bare tile nodes (a little uneven, like names). */
const BAR_WIDTHS = [74, 88, 62, 80];

function Node({
  agent,
  index,
  box,
  t,
  stopped,
  variant,
  bare,
}: {
  agent: TAgent;
  index: number;
  box: { x: number; y: number; w: number; h: number };
  t: number;
  stopped: boolean;
  variant: GraphVariant;
  bare: boolean;
}) {
  const status = statusAt(agent.start, agent.end, t, stopped);
  const sent = t >= agent.sent;
  const state = !sent ? "queued" : status;
  // Each node's border light starts at its own point of the turn.
  const style = { left: box.x, top: box.y, width: box.w, height: box.h, animationDelay: `${(-0.73 * index).toFixed(2)}s` };

  if (variant === "wide") {
    const activity = status === "stopped" ? "stopped" : agentActivity(agent, t);
    const done = status === "done";
    return (
      <div className="ar-node absolute flex flex-col justify-center gap-[5px] ps-3 pe-2.5" data-state={state} data-variant={variant} style={style}>
        <div className="flex h-[14px] items-center gap-2">
          <GlyphShape glyph={agent.spec.glyph} size={8} className="ar-node-glyph" />
          <span className={cn("min-w-0 flex-1 truncate text-[12.5px] leading-none font-medium tracking-[-0.01em]", sent ? "text-primary" : "text-tertiary")}>
            {agent.spec.name}
          </span>
          {done ? (
            <span className="ar-mono ar-fade shrink-0 text-[10.5px] leading-none text-tertiary">
              {kilo(agent.spec.tokens)} · {formatSeconds(agent.end - agent.start)}
            </span>
          ) : null}
          <span className="grid w-[13px] shrink-0 place-items-center">
            <NodeStatus status={status} size={13} />
          </span>
        </div>
        <span
          key={activity}
          className={cn(
            "ar-fade block truncate ps-4 leading-[13px]",
            done ? "text-[11.5px] text-secondary" : status === "running" ? "ar-mono text-[11px] text-secondary" : "ar-mono text-[11px] text-tertiary",
          )}
        >
          {activity}
        </span>
      </div>
    );
  }

  const stage = variant === "narrow";
  return (
    <div
      className={cn("ar-node absolute flex items-center", stage ? "gap-[7px] ps-2.5 pe-[7px]" : "gap-[3px] ps-[4px] pe-[3px]")}
      data-state={state}
      data-variant={variant}
      style={style}
    >
      <GlyphShape glyph={agent.spec.glyph} size={stage ? 8 : 5} className="ar-node-glyph" />
      {bare ? (
        // a line of "text" with no letters: reads as a label at any size
        <span className={cn("min-w-0 flex-1", sent ? "text-primary" : "text-tertiary")}>
          <span
            className="block h-[2.5px] rounded-full bg-current opacity-30 transition-opacity duration-300"
            style={{ width: `${BAR_WIDTHS[index % BAR_WIDTHS.length]}%` }}
          />
        </span>
      ) : (
        <span className={cn("min-w-0 flex-1 truncate leading-none", stage ? "text-[12px] tracking-[-0.01em]" : "text-[8px]", sent ? "text-primary" : "text-tertiary")}>
          {agent.spec.name}
        </span>
      )}
      <span className="grid shrink-0 place-items-center" style={{ width: stage ? 12 : 7 }}>
        <NodeStatus status={status} size={stage ? 12 : 7} />
      </span>
    </div>
  );
}
