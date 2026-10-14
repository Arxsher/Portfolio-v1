// Posters for the lab: a small code-drawn picture of each piece, in the
// arch's own 100 x 125 box. They stand in the niches (home arcade, lab
// index, previous / next) and on the stage while the live piece loads, or
// for good when a piece is still being built: a zellige panel, a
// split-flap board, a wax seal, a macropad, glass over stripes, an agent
// graph, a commit city, a record and the dusk view.
//
//   <PieceArt slug="zellige" />                     fills its box (slice)
//   <ArchFrame windowStyle={{ background: artGround("seal") }}><PieceArt slug="seal" /></ArchFrame>
//
// Server-safe (no hooks, no client code): render posters on the server and
// hand them to client components as props, so the drawings (and the
// contribution data the commit city reads) never ship as JavaScript.
// Colours come from the zellige tokens, so the posters follow the theme.
// `uid` keeps gradient and clip ids unique when one slug is drawn twice on
// a page.

import type { ReactElement } from "react";
import contributions from "@/data/contributions.json";
import { crossPoints, starPoints } from "@/lib/zellige";

const T = {
  blue: "var(--z-blue)",
  deep: "var(--z-deep)",
  green: "var(--z-green)",
  ochre: "var(--z-ochre)",
  terra: "var(--z-terra)",
  cream: "var(--z-cream)",
  grout: "var(--grout)",
  ink: "#1a1d3a",
  night: "#0e1127",
  sand: "#f2e9d8",
};

const SANS = "var(--font-instrument), ui-sans-serif, system-ui, sans-serif";

type Draw = (uid: string) => ReactElement;

/* ---------------------------------------------------------------------- */
/* the pieces                                                              */
/* ---------------------------------------------------------------------- */

const zellige: Draw = () => {
  const pitch = 25;
  const crosses = [];
  const stars = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 5; col++)
      crosses.push(
        <polygon
          key={`c${col}-${row}`}
          points={crossPoints(col * pitch - 12.5, row * pitch - 12.5, pitch)}
          fill={(col + row) % 2 ? T.terra : T.cream}
        />,
      );
  for (let row = 0; row <= 6; row++)
    for (let col = 0; col <= 5; col++)
      stars.push(
        <polygon
          key={`s${col}-${row}`}
          points={starPoints(col * pitch - 12.5, row * pitch - 12.5, pitch / 2)}
          fill={(col + row * 2) % 5 === 0 ? T.green : (col * row) % 7 === 3 ? T.ochre : T.blue}
        />,
      );
  return (
    <g stroke={T.grout} strokeWidth="1.1" strokeLinejoin="round">
      <rect width="100" height="125" fill={T.grout} stroke="none" />
      {crosses}
      {stars}
    </g>
  );
};

const splitFlap: Draw = () => {
  const row = (text: string, y: number, size: number, gap: number) => {
    const w = size * 0.72;
    const width = text.length * w + (text.length - 1) * gap;
    const x0 = 50 - width / 2;
    return text.split("").map((char, i) => {
      const x = x0 + i * (w + gap);
      return (
        <g key={`${y}-${i}`}>
          <rect x={x} y={y} width={w} height={size} rx="1.4" fill="#262a52" />
          <rect x={x} y={y} width={w} height={size / 2} rx="1.4" fill="#2f3462" />
          <text
            x={x + w / 2}
            y={y + size * 0.78}
            textAnchor="middle"
            fontSize={size * 0.8}
            fontWeight="700"
            fill={T.sand}
            style={{ fontFamily: SANS }}
          >
            {char}
          </text>
          <line x1={x} x2={x + w} y1={y + size / 2} y2={y + size / 2} stroke="#0b0d22" strokeWidth="0.8" />
        </g>
      );
    });
  };
  return (
    <g>
      <rect width="100" height="125" fill={T.night} />
      <text
        x="50"
        y="44"
        textAnchor="middle"
        fontSize="5"
        letterSpacing="1.6"
        fontWeight="700"
        fill="#e6b65a"
        style={{ fontFamily: SANS }}
      >
        DEPARTURES
      </text>
      {row("CASA", 52, 18, 2)}
      {row("BLANCA", 78, 12, 1.6)}
      <circle cx="31" cy="104" r="1.6" fill="#5cc79a" />
      <rect x="36" y="102.5" width="34" height="3" rx="1.5" fill="#262a52" />
    </g>
  );
};

const seal: Draw = () => {
  const blobs = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const r = 17 + (i % 3) * 1.4;
    return (
      <circle key={i} cx={50 + Math.cos(a) * r} cy={78 + Math.sin(a) * r} r={4.2 + (i % 2)} fill="#a8432a" />
    );
  });
  return (
    <g>
      <rect width="100" height="125" fill={T.cream} />
      <rect x="14" y="44" width="72" height="66" fill="#fbf7ef" stroke="#d9cdb6" strokeWidth="0.8" />
      <path d="M14 44 50 80 86 44" fill="none" stroke="#d9cdb6" strokeWidth="0.8" />
      {blobs}
      <circle cx="50" cy="78" r="18" fill="#b84e31" />
      <circle cx="50" cy="78" r="13" fill="none" stroke="#8c3520" strokeWidth="1.2" />
      <polygon points={starPoints(50, 78, 9)} fill="#8c3520" />
      <polygon points={starPoints(49.4, 77.2, 9)} fill="none" stroke="#e08a63" strokeWidth="0.7" />
    </g>
  );
};

const macropad: Draw = () => {
  const keys = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      const lit = r === 1 && c === 2;
      keys.push(
        <g key={`${r}-${c}`}>
          <rect x={27 + c * 16} y={60 + r * 16} width="14" height="14" rx="3" fill={lit ? "#d39a35" : "#efe4cf"} />
          <rect x={29 + c * 16} y={61.5 + r * 16} width="10" height="9" rx="2.2" fill={lit ? "#f0c06a" : "#fffaf0"} />
        </g>,
      );
    }
  return (
    <g>
      <rect width="100" height="125" fill={T.deep} />
      <rect x="22" y="38" width="56" height="74" rx="7" fill={T.ink} />
      <circle cx="68" cy="48" r="5.5" fill="#2b2f5c" stroke="#d39a35" strokeWidth="1" />
      <line x1="68" y1="48" x2="68" y2="43.5" stroke="#d39a35" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="30" cy="48" r="1.6" fill="#5cc79a" />
      {keys}
    </g>
  );
};

const liquidGlass: Draw = (uid) => {
  const clip = `${uid}-glass-clip`;
  const sheen = `${uid}-glass-sheen`;
  const stripes = Array.from({ length: 14 }, (_, i) => (
    <rect
      key={i}
      x={i * 8 - 4}
      y="0"
      width="4"
      height="125"
      fill={i % 3 === 0 ? T.terra : i % 3 === 1 ? T.blue : T.ochre}
    />
  ));
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <rect x="20" y="62" width="60" height="26" rx="13" />
        </clipPath>
        <linearGradient id={sheen} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <rect width="100" height="125" fill={T.cream} />
      <g opacity="0.85">{stripes}</g>
      {/* inside the glass the stripes bend and magnify */}
      <g clipPath={`url(#${clip})`}>
        <rect x="0" y="0" width="100" height="125" fill={T.cream} />
        <g transform="translate(50 75) scale(1.45 1) translate(-50 -75)">{stripes}</g>
        <rect x="20" y="62" width="60" height="26" rx="13" fill={`url(#${sheen})`} />
      </g>
      <rect x="20" y="62" width="60" height="26" rx="13" fill="none" stroke="#fff" strokeOpacity="0.9" strokeWidth="1" />
      <circle cx="70" cy="101" r="5" fill="#fff" fillOpacity="0.35" stroke="#fff" strokeOpacity="0.9" strokeWidth="0.8" />
    </g>
  );
};

const agentRun: Draw = () => {
  const nodes: Array<[number, number, string]> = [
    [50, 52, "#d39a35"],
    [30, 78, "#3a64c8"],
    [50, 86, "#3a64c8"],
    [70, 78, "#23805f"],
    [40, 104, "#3a3f78"],
    [60, 104, "#3a3f78"],
  ];
  const links: Array<[number, number]> = [
    [0, 1],
    [0, 2],
    [0, 3],
    [2, 4],
    [2, 5],
  ];
  return (
    <g>
      <rect width="100" height="125" fill={T.night} />
      {links.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a][0]}
          y1={nodes[a][1]}
          x2={nodes[b][0]}
          y2={nodes[b][1]}
          stroke="#3a3f78"
          strokeWidth="1"
          strokeDasharray={i > 2 ? "2 2" : undefined}
        />
      ))}
      {nodes.map(([x, y, fill], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={i === 0 ? 7 : 4.5} fill={fill} />
          {i === 0 ? <polygon points={starPoints(x, y, 4)} fill={T.night} /> : null}
        </g>
      ))}
      <rect x="26" y="30" width="48" height="3" rx="1.5" fill="#262a52" />
      <rect x="26" y="30" width="31" height="3" rx="1.5" fill="#5cc79a" />
    </g>
  );
};

const commitCity: Draw = () => {
  // The last 36 days of real contributions, as a 6 x 6 block of towers.
  const days = contributions.days.slice(-36);
  const tile = 5.4;
  const blocks = [];
  for (let gy = 0; gy < 6; gy++)
    for (let gx = 0; gx < 6; gx++) {
      const day = days[gy * 6 + gx];
      const level = day ? day.level : 0;
      const height = 2 + level * 5;
      const x = 50 + (gx - gy) * tile;
      const y = 62 + (gx + gy) * (tile / 2);
      const top = `${x},${y - height} ${x + tile},${y + tile / 2 - height} ${x},${y + tile - height} ${x - tile},${y + tile / 2 - height}`;
      const left = `${x - tile},${y + tile / 2 - height} ${x},${y + tile - height} ${x},${y + tile} ${x - tile},${y + tile / 2}`;
      const right = `${x + tile},${y + tile / 2 - height} ${x},${y + tile - height} ${x},${y + tile} ${x + tile},${y + tile / 2}`;
      const lit = level >= 3;
      blocks.push(
        <g key={`${gx}-${gy}`}>
          <polygon points={left} fill={lit ? "#a8432a" : "#172f72"} />
          <polygon points={right} fill={lit ? "#c4643b" : "#1f45a0"} />
          <polygon points={top} fill={lit ? "#e6a173" : level ? "#7f9be0" : "#c9d2ea"} />
        </g>,
      );
    }
  return (
    <g>
      <rect width="100" height="125" fill={T.cream} />
      {blocks}
    </g>
  );
};

const turntable: Draw = () => (
  <g>
    <rect width="100" height="125" fill={T.terra} />
    <rect x="16" y="40" width="68" height="74" rx="4" fill="#f2e3c8" />
    <circle cx="47" cy="77" r="27" fill="#141634" />
    {[24, 21, 18, 15, 12].map((r) => (
      <circle key={r} cx="47" cy="77" r={r} fill="none" stroke="#2a2d55" strokeWidth="0.5" />
    ))}
    <path d="M30 60a24 24 0 0 1 12-6" fill="none" stroke="#5a5f98" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="47" cy="77" r="8.5" fill="#d39a35" />
    <polygon points={starPoints(47, 77, 4.5)} fill="#a8432a" />
    <circle cx="47" cy="77" r="1" fill="#141634" />
    <circle cx="76" cy="50" r="4" fill="#c9b796" />
    <path d="M76 50 L74 86 L66 94" fill="none" stroke="#8b7b5e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="62" y="92" width="7" height="4" rx="1" fill="#1a1d3a" transform="rotate(-40 65 94)" />
  </g>
);

const dusk: Draw = (uid) => {
  const sky = `${uid}-dusk-sky`;
  const dither = `${uid}-dusk-dither`;
  return (
    <g>
      <defs>
        <linearGradient id={sky} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#2a2c68" />
          <stop offset="0.38" stopColor="#744073" />
          <stop offset="0.62" stopColor="#d86f50" />
          <stop offset="0.8" stopColor="#f6cb7e" />
        </linearGradient>
        <pattern id={dither} width="3" height="3" patternUnits="userSpaceOnUse">
          <rect width="1" height="1" fill="#000" opacity="0.18" />
          <rect x="1.5" y="1.5" width="1" height="1" fill="#fff" opacity="0.1" />
        </pattern>
      </defs>
      <rect width="100" height="86" fill={`url(#${sky})`} />
      <circle cx="62" cy="80" r="11" fill="#fdebc2" />
      <rect y="84" width="100" height="41" fill="#1d2457" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect
          key={i}
          x={62 - 5 - i * 2.4}
          y={88 + i * 5.5}
          width={10 + i * 4.8}
          height="1.8"
          fill="#eca057"
          opacity={0.9 - i * 0.1}
        />
      ))}
      <rect width="100" height="125" fill={`url(#${dither})`} />
      <path d="M0 82h38v4H0zM6 79h28v3H6zM24 46h5v33h-5zM25 40h3v6h-3zM26.2 35h.8v5h-.8z" fill="#12153a" />
      <path d="M74 80h4v-6h3v6h3v-10h3v10h5v-4h3v4h5v6H74z" fill="#12153a" />
    </g>
  );
};

const ART: Record<string, { ground: string; draw: Draw }> = {
  zellige: { ground: T.blue, draw: zellige },
  "split-flap": { ground: T.night, draw: splitFlap },
  seal: { ground: T.cream, draw: seal },
  macropad: { ground: T.deep, draw: macropad },
  "liquid-glass": { ground: T.cream, draw: liquidGlass },
  "agent-run": { ground: T.night, draw: agentRun },
  "commit-city": { ground: T.cream, draw: commitCity },
  turntable: { ground: T.terra, draw: turntable },
  dusk: { ground: "#2a2c68", draw: dusk },
};

/** The colour behind a piece's poster (the niche's ground), or the band for a piece without one. */
export function artGround(slug: string): string {
  return ART[slug]?.ground ?? "var(--band)";
}

/** Whether a slug has a drawn poster. */
export function hasArt(slug: string): boolean {
  return slug in ART;
}

/**
 * A piece's poster as an SVG that covers its box (100 x 125, cropped to
 * fit). Decorative. A piece without a drawing gets a quiet star on the band.
 */
export function PieceArt({ slug, uid = slug, className }: { slug: string; uid?: string; className?: string }) {
  const art = ART[slug];
  const id = uid.replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg
      viewBox="0 0 100 125"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={className ?? "absolute inset-0 size-full"}
    >
      {art ? (
        art.draw(id)
      ) : (
        <g>
          <rect width="100" height="125" fill="var(--band)" />
          <polygon points={starPoints(50, 74, 14)} fill="none" stroke="var(--line-firm)" strokeWidth="1" />
        </g>
      )}
    </svg>
  );
}
