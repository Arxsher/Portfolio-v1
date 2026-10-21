// The guest house as drawn: plinth, shadows, walls, every window opening,
// the lobby, the roof and its little machine room, two model trees and a
// street lamp. Static geometry from layout.ts; every colour is a CSS
// variable from styles.ts, so day and night (and the fade between them)
// are pure CSS. The guests' window panes are HTML buttons laid over the
// openings drawn here (house.tsx).
//
// Painter's order: plinth, shadows on it, side wall, facade, roof, then
// the things standing in front of the building.

import { memo } from "react";
import { DX, DY, FW, P, PER_FLOOR, poly, r, roundedPoly, type HouseLayout, type Pt, type Rect } from "./layout";

/** The glass inside an opening: the opening seen through its recess (up and to the right). */
export function glassRect(rect: Rect): Rect {
  const depth = 4;
  return { x: rect.x + depth * DX, y: rect.y, w: rect.w - depth * DX, h: rect.h - depth * DY };
}

const stop = (color: string, offset: number, opacity?: number) => (
  <stop offset={offset} style={{ stopColor: color, stopOpacity: opacity }} />
);

type Props = { layout: HouseLayout; uid: string };

export const HouseBody = memo(function HouseBody({ layout, uid }: Props) {
  const { box, height: H, depth: D, plinth, slots, slabs, rooftop, lobbyHeight, breakAt, hidden } = layout;
  const id = (name: string) => `${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;

  const { left: L, right: R, front: S, back: B, thick: T } = plinth;
  const top: Pt[] = [P(-L, 0, -S), P(FW + R, 0, -S), P(FW + R, 0, D + B), P(-L, 0, D + B)];
  const topPath = roundedPoly(top, 15);
  const sideCopies = [];
  for (let k = T; k >= 1; k -= 1) sideCopies.push(k);

  // Cast shadow: the footprint pushed along the light, clipped to the plinth.
  const sx = 0.56;
  const sz = 0.04;
  const reach = H * 0.9;
  const shadow = poly([
    P(FW, 0, 0),
    P(FW + reach * sx, 0, reach * sz),
    P(FW + reach * sx, 0, D + reach * sz),
    P(FW, 0, D),
  ]);
  const [shadowX0] = P(FW, 0, 0);

  const side = poly([P(FW, 0, 0), P(FW, 0, D), P(FW, H, D), P(FW, H, 0)]);
  const roof = poly([P(0, H, 0), P(FW, H, 0), P(FW, H, D), P(0, H, D)]);
  const deck = poly([P(6, H, 6), P(FW - 6, H, 6), P(FW - 6, H, D - 6), P(6, H, D - 6)]);

  // the machine room on the roof
  const { x0, x1, z0, z1, h: rh, antenna } = rooftop;
  const roomFront = poly([P(x0, H, z0), P(x1, H, z0), P(x1, H + rh, z0), P(x0, H + rh, z0)]);
  const roomSide = poly([P(x1, H, z0), P(x1, H, z1), P(x1, H + rh, z1), P(x1, H + rh, z0)]);
  const roomTop = poly([P(x0, H + rh, z0), P(x1, H + rh, z0), P(x1, H + rh, z1), P(x0, H + rh, z1)]);
  const roomShadow = poly([P(x1, H, z0), P(x1 + 30, H, z0 + 2), P(x1 + 30, H, z1 + 2), P(x1, H, z1)]);
  const [ax, ay] = P(antenna.x, H + rh, antenna.z);
  const [bx, by] = P(antenna.x, H + rh + antenna.h, antenna.z);

  // lobby: a glass storefront with a door and a canopy
  const cx = FW / 2;
  const shopX0 = 22;
  const shopX1 = FW - 22;
  const shopTop = 52;
  const panes = 6;
  const doorW = 58;
  const canopy = { x0: cx - 50, x1: cx + 50, low: 54, high: 59, z: -16 };

  return (
    <g className="gh-scene">
      <defs>
        {/* Gradients hold fixed colours only: the theme changes fills and
            opacities, which transition reliably (stop colours don't repaint). */}
        <linearGradient id={id("shade")} x1="0" y1="0" x2="0" y2="1">
          {stop("#000", 0, 0)}
          {stop("#000", 1, 1)}
        </linearGradient>
        <linearGradient id={id("lift")} x1="0" y1="0" x2="0" y2="1">
          {stop("#fff", 0, 0)}
          {stop("#fff", 1, 1)}
        </linearGradient>
        <linearGradient id={id("lobby-light")} x1="0" y1="0" x2="0" y2="1">
          {stop("rgb(255 234 202)", 0, 0.82)}
          {stop("rgb(240 196 140)", 0.55, 0.5)}
          {stop("rgb(200 150 96)", 1, 0.34)}
        </linearGradient>
        <linearGradient id={id("sheen")} x1="0" y1="0" x2="1" y2="0.55">
          {stop("#fff", 0.2, 0)}
          {stop("#fff", 0.34, 0.6)}
          {stop("#fff", 0.47, 0.08)}
          {stop("#fff", 0.58, 0)}
        </linearGradient>
        <linearGradient
          id={id("cast")}
          gradientUnits="userSpaceOnUse"
          x1={r(shadowX0)}
          y1="0"
          x2={r(shadowX0 + Math.min(reach * sx, R + 30))}
          y2="0"
        >
          {stop("rgb(34 32 44)", 0)}
          {stop("rgb(34 32 44)", 0.35, 0.75)}
          {stop("rgb(34 32 44)", 1, 0)}
        </linearGradient>
        <linearGradient id={id("contact")} x1="0" y1="0" x2="0" y2="1">
          {stop("rgb(30 28 38)", 0)}
          {stop("rgb(30 28 38)", 1, 0)}
        </linearGradient>
        <radialGradient id={id("tree")} cx="0.36" cy="0.3" r="0.7">
          {stop("#fff", 0, 1)}
          {stop("#fff", 0.55, 0.55)}
          {stop("#fff", 1, 0)}
        </radialGradient>
        <radialGradient id={id("pool")}>
          {stop("rgb(255 206 140)", 0, 0.42)}
          {stop("rgb(255 206 140)", 1, 0)}
        </radialGradient>
        <clipPath id={id("plinth")}>
          <path d={topPath} />
        </clipPath>
        <filter id={id("soft")} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <filter id={id("drop")} x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {/* plinth */}
      <path d={topPath} transform={`translate(0 ${T + 8})`} fill="var(--gh-drop)" filter={url("drop")} />
      {sideCopies.map((k) => (
        <path key={k} d={topPath} transform={`translate(0 ${k})`} fill={k === T ? "var(--gh-plinth-side)" : "var(--gh-plinth-front)"} />
      ))}
      <path d={topPath} fill="var(--gh-plinth-top)" />
      <path d={topPath} fill="none" stroke="var(--gh-plinth-rim)" strokeWidth={1} />

      {/* shadows on the plinth */}
      <g clipPath={url("plinth")}>
        <path d={shadow} fill={url("cast")} filter={url("soft")} style={{ opacity: "var(--gh-shadow-a)" }} />
        <path
          d={poly([P(-4, 0, 0), P(FW + 2, 0, 0), P(FW + 2, 0, -12), P(-4, 0, -12)])}
          fill={url("contact")}
          filter={url("soft")}
          style={{ opacity: "var(--gh-contact-a)" }}
        />
        <Tree shadowOnly x={-36} z={-40} radius={15} height={34} fill={url("tree")} soft={url("soft")} />
        <Tree shadowOnly x={-50} z={10} radius={11} height={26} fill={url("tree")} soft={url("soft")} />
        <Tree shadowOnly x={FW + 58} z={-22} radius={13} height={30} fill={url("tree")} soft={url("soft")} />
        <ellipse
          className="gh-lamp-glow"
          cx={r(P(FW + 24, 0, -50)[0])}
          cy={r(P(FW + 24, 0, -50)[1])}
          rx={34}
          ry={12}
          fill={url("pool")}
        />
      </g>

      {/* the back tree, left of the building */}
      <Tree x={-50} z={10} radius={11} height={26} fill={url("tree")} soft={url("soft")} />

      {/* side wall */}
      <path d={side} fill="var(--gh-side)" />
      <path d={side} fill={url("shade")} style={{ opacity: "var(--gh-side-shade)" }} />
      {slabs.map((up) => (
        <path key={up} d={`M${r(P(FW, up, 0)[0])} ${r(P(FW, up, 0)[1])}L${r(P(FW, up, D)[0])} ${r(P(FW, up, D)[1])}`} stroke="var(--gh-slab-side)" strokeWidth={1} />
      ))}

      {/* facade */}
      <rect x={0} y={-H} width={FW} height={H} fill="var(--gh-wall)" />
      <rect x={0} y={-Math.min(H, 160)} width={FW} height={Math.min(H, 160)} fill={url("shade")} style={{ opacity: "var(--gh-wall-shade)" }} />
      {slabs.map((up) => (
        <rect key={up} x={0} y={r(-up - 0.5)} width={FW} height={1} fill="var(--gh-slab)" />
      ))}
      {slots.map((slot) => (
        <Opening key={slot.index} rect={slot.rect} glass="var(--gh-glass)" lift={url("lift")} sheen={url("sheen")} />
      ))}

      {/* lobby */}
      <Opening rect={{ x: shopX0, y: -shopTop, w: shopX1 - shopX0, h: shopTop }} glass="var(--gh-lobby)" lift={url("lift")} sheen={url("sheen")} noSill />
      <rect
        className="gh-lobby-light"
        x={r(glassRect({ x: shopX0, y: -shopTop, w: shopX1 - shopX0, h: shopTop }).x)}
        y={-shopTop}
        width={r(glassRect({ x: shopX0, y: -shopTop, w: shopX1 - shopX0, h: shopTop }).w)}
        height={r(shopTop - 4 * DY)}
        fill={url("lobby-light")}
      />
      {/* the lobby inside: a reception desk and a row of ceiling lights */}
      <rect x={r(cx + 46)} y={-15} width={74} height={15} rx={1.5} fill="var(--gh-jamb)" opacity={0.55} />
      <rect x={r(cx + 46)} y={-15} width={74} height={2} fill="var(--gh-reveal-lit)" opacity={0.5} />
      {Array.from({ length: 7 }, (_, k) => (
        <rect key={k} className="gh-lobby-light" x={r(shopX0 + 22 + k * ((shopX1 - shopX0 - 44) / 6) - 5)} y={r(-shopTop + 3)} width={10} height={1.6} rx={0.8} fill="rgb(255 244 222)" />
      ))}
      {Array.from({ length: panes - 1 }, (_, k) => {
        const x = shopX0 + ((shopX1 - shopX0) / panes) * (k + 1);
        if (Math.abs(x - cx) < doorW / 2 + 2) return null;
        return <rect key={k} x={r(x - 1)} y={-shopTop} width={2} height={shopTop} fill="var(--gh-mullion)" />;
      })}
      <rect x={r(cx - doorW / 2 - 1.5)} y={-shopTop + 8} width={3} height={shopTop - 8} fill="var(--gh-mullion)" />
      <rect x={r(cx + doorW / 2 - 1.5)} y={-shopTop + 8} width={3} height={shopTop - 8} fill="var(--gh-mullion)" />
      <rect x={r(cx - 1)} y={-shopTop + 8} width={2} height={shopTop - 8} fill="var(--gh-mullion)" />
      <rect x={r(cx - doorW / 2)} y={-shopTop + 7} width={doorW} height={2} fill="var(--gh-mullion)" />
      <rect x={r(cx - 13)} y={-26} width={9} height={1.6} rx={0.8} fill="var(--gh-mullion)" />
      <rect x={r(cx + 4)} y={-26} width={9} height={1.6} rx={0.8} fill="var(--gh-mullion)" />
      {/* canopy and the shadow it throws on the wall */}
      <rect x={canopy.x0 + 3} y={-canopy.low} width={canopy.x1 - canopy.x0 - 6} height={6} fill="var(--gh-shadow)" filter={url("soft")} />
      <path
        d={poly([P(canopy.x0, canopy.high, canopy.z), P(canopy.x1, canopy.high, canopy.z), P(canopy.x1, canopy.high, 0), P(canopy.x0, canopy.high, 0)])}
        fill="var(--gh-roof)"
      />
      <path
        d={poly([P(canopy.x0, canopy.low, canopy.z), P(canopy.x1, canopy.low, canopy.z), P(canopy.x1, canopy.high, canopy.z), P(canopy.x0, canopy.high, canopy.z)])}
        fill="var(--gh-wall-lo)"
      />
      <path
        d={`M${r(P(canopy.x0, canopy.high, canopy.z)[0])} ${r(P(canopy.x0, canopy.high, canopy.z)[1])}L${r(P(canopy.x1, canopy.high, canopy.z)[0])} ${r(P(canopy.x1, canopy.high, canopy.z)[1])}`}
        stroke="var(--gh-rim)"
        strokeWidth={1}
      />
      <text
        x={cx}
        y={-(lobbyHeight - 12)}
        textAnchor="middle"
        fontSize={7}
        letterSpacing={2.6}
        fill="var(--gh-text)"
        style={{ fontFamily: "var(--font-sans)", fontWeight: 500 }}
      >
        GUESTBOOK
      </text>

      {breakAt !== null && hidden ? <BreakLine at={breakAt} depth={D} from={hidden.from} to={hidden.to} /> : null}

      {/* roof */}
      <path d={roof} fill="var(--gh-roof)" />
      <path d={deck} fill="var(--gh-deck)" />
      <path d={roomShadow} fill="var(--gh-shadow)" filter={url("soft")} opacity={0.7} />
      <path d={roomSide} fill="var(--gh-side)" />
      <path d={roomFront} fill="var(--gh-wall)" />
      <path d={roomTop} fill="var(--gh-roof)" />
      <rect
        x={r(P(x0 + 12, H, z0)[0])}
        y={r(P(x0 + 12, H + 15, z0)[1])}
        width={11}
        height={15}
        fill="var(--gh-jamb)"
      />
      <path
        d={`M${r(P(x0, H + rh, z0)[0])} ${r(P(x0, H + rh, z0)[1])}L${r(P(x1, H + rh, z0)[0])} ${r(P(x1, H + rh, z0)[1])}L${r(P(x1, H + rh, z1)[0])} ${r(P(x1, H + rh, z1)[1])}`}
        fill="none"
        stroke="var(--gh-rim)"
        strokeWidth={1}
      />
      <path
        d={`M0 ${r(-H)}L${FW} ${r(-H)}L${r(P(FW, H, D)[0])} ${r(P(FW, H, D)[1])}`}
        fill="none"
        stroke="var(--gh-rim)"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <line x1={r(ax)} y1={r(ay)} x2={r(bx)} y2={r(by)} stroke="var(--gh-trunk)" strokeWidth={1.4} strokeLinecap="round" />
      <line x1={r(ax - 5)} y1={r(ay - 18)} x2={r(ax + 5)} y2={r(ay - 18 - 3)} stroke="var(--gh-trunk)" strokeWidth={1.1} strokeLinecap="round" />
      <circle cx={r(bx)} cy={r(by)} r={1.9} fill="var(--gh-beacon)" />

      {/* in front of the building */}
      <Tree x={-36} z={-40} radius={15} height={34} fill={url("tree")} soft={url("soft")} />
      <Tree x={FW + 58} z={-22} radius={13} height={30} fill={url("tree")} soft={url("soft")} />
      <Lamp x={FW + 24} z={-50} pool={url("pool")} />

      {/* keep the box (and so the percentages) exact */}
      <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="none" />
    </g>
  );
});

function Opening({ rect, glass, lift, sheen, noSill = false }: { rect: Rect; glass: string; lift: string; sheen: string; noSill?: boolean }) {
  const g = glassRect(rect);
  const { x, y, w, h } = rect;
  const lip = 4 * DX;
  return (
    <g>
      <rect x={r(x)} y={r(y)} width={r(w)} height={r(h)} fill="var(--gh-jamb)" />
      <path d={poly([[x, y + h], [x + w, y + h], [x + w, y + h - 4 * DY], [x + lip, y + h - 4 * DY]])} fill="var(--gh-reveal-lit)" />
      <rect x={r(g.x)} y={r(g.y)} width={r(g.w)} height={r(g.h)} fill={glass} />
      <rect x={r(g.x)} y={r(g.y)} width={r(g.w)} height={r(g.h)} fill={lift} style={{ opacity: "var(--gh-glass-lift)" }} />
      <rect x={r(g.x)} y={r(g.y)} width={r(g.w)} height={r(g.h)} fill={sheen} style={{ opacity: "var(--gh-sheen)" }} />
      {noSill ? null : (
        <>
          <rect x={r(x - 3)} y={r(y + h + 2.2)} width={r(w + 6)} height={1.4} fill="var(--gh-sill-shadow)" />
          <rect x={r(x - 3)} y={r(y + h)} width={r(w + 6)} height={2.4} rx={0.6} fill="var(--gh-sill)" />
        </>
      )}
    </g>
  );
}

function Tree({
  x,
  z,
  radius,
  height,
  fill,
  soft,
  shadowOnly = false,
}: {
  x: number;
  z: number;
  radius: number;
  height: number;
  fill: string;
  soft: string;
  shadowOnly?: boolean;
}) {
  const [gx, gy] = P(x, 0, z);
  const [cx, cy] = P(x, height, z);
  if (shadowOnly) {
    return <ellipse cx={r(gx + radius * 1.1)} cy={r(gy - 1)} rx={r(radius * 1.35)} ry={r(radius * 0.46)} fill="var(--gh-shadow)" filter={soft} />;
  }
  // A model tree: a few spheres of foam on a wire trunk.
  const balls: Array<[number, number, number]> = [
    [-0.5, 0.38, 0.7],
    [0.55, 0.42, 0.62],
    [0, 0, 1],
  ];
  return (
    <g>
      <line x1={r(gx)} y1={r(gy)} x2={r(cx)} y2={r(cy + radius * 0.5)} stroke="var(--gh-trunk)" strokeWidth={2} strokeLinecap="round" />
      {balls.map(([dx, dy, k], i) => (
        <g key={i}>
          <circle cx={r(cx + dx * radius)} cy={r(cy + dy * radius)} r={r(radius * k)} fill="var(--gh-tree)" />
          <circle cx={r(cx + dx * radius)} cy={r(cy + dy * radius)} r={r(radius * k)} fill={fill} style={{ opacity: "var(--gh-tree-hl)" }} />
        </g>
      ))}
      <path
        d={`M${r(cx - radius * 0.78)} ${r(cy - radius * 0.5)}A${radius} ${radius} 0 0 1 ${r(cx + radius * 0.2)} ${r(cy - radius * 0.98)}`}
        fill="none"
        stroke="var(--gh-plinth-rim)"
        strokeWidth={1}
        strokeLinecap="round"
      />
    </g>
  );
}

function Lamp({ x, z, pool }: { x: number; z: number; pool: string }) {
  const [gx, gy] = P(x, 0, z);
  const [hx, hy] = P(x, 46, z);
  return (
    <g>
      <line x1={r(gx)} y1={r(gy)} x2={r(hx)} y2={r(hy)} stroke="var(--gh-trunk)" strokeWidth={1.6} strokeLinecap="round" />
      <path d={`M${r(hx)} ${r(hy)}q0 -3 -7 -3`} fill="none" stroke="var(--gh-trunk)" strokeWidth={1.4} strokeLinecap="round" />
      <circle className="gh-lamp-glow" cx={r(hx - 7)} cy={r(hy - 1)} r={12} fill={pool} />
      <rect x={r(hx - 10.5)} y={r(hy - 2.2)} width={7} height={2.6} rx={1.3} fill="var(--gh-lamp-head)" />
    </g>
  );
}

/** The architectural break: two zigzags with the floors between them left out. */
function BreakLine({ at, depth, from, to }: { at: number; depth: number; from: number; to: number }) {
  const low = at + 8;
  const high = at + 26;
  const zig = (up: number) => {
    const pts: Pt[] = [];
    const teeth = 9;
    for (let k = 0; k <= teeth; k++) {
      const x = (FW / teeth) * k;
      pts.push([x, -(up + (k % 2 ? 3 : -3))]);
    }
    pts.push(P(FW, up, 0), P(FW, up + 3, depth * 0.5), P(FW, up - 2, depth));
    return pts;
  };
  const a = zig(low);
  const b = zig(high);
  const band = [...a, ...[...b].reverse()];
  const label = from === to ? `floor ${from}` : `floors ${from}–${to}`;
  return (
    <g>
      <path d={poly(band)} fill="var(--gh-break-fill)" />
      <path d={a.map(([x, y], i) => `${i ? "L" : "M"}${r(x)} ${r(y)}`).join("")} fill="none" stroke="var(--gh-break)" strokeWidth={1} strokeLinejoin="round" />
      <path d={b.map(([x, y], i) => `${i ? "L" : "M"}${r(x)} ${r(y)}`).join("")} fill="none" stroke="var(--gh-break)" strokeWidth={1} strokeLinejoin="round" />
      <text
        x={FW / 2}
        y={-(low + high) / 2 + 3}
        textAnchor="middle"
        fontSize={8}
        letterSpacing={0.6}
        fill="var(--gh-break)"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {label}
      </text>
    </g>
  );
}

export { PER_FLOOR };
