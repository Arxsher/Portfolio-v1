// The compact switch at rest as plain SVG, for the moment before the canvas
// has drawn (the header is server-rendered, and the theme is only known on
// the client from the class the no-flash script put on <html>). Both ends are
// in the markup and CSS picks one (`dark:` variants), so the right one shows
// on first paint. Drawn from the same geometry and palette as the canvas,
// so swapping to the live switch is invisible.

import { keyColor } from "./palette";
import { CLOUD_BASE, CLOUD_PUFFS, COMPACT_CLOUD } from "./render";
import { hillY, makeStars, moonAt, shiftAt, STAR_FIELDS, sunAt, trackFor, type HillLayer } from "./scene";

const LAYERS: readonly HillLayer[] = ["far", "mid", "near"];

function ridgePath(layer: HillLayer, w: number, h: number, t: number): string {
  const dx = shiftAt(layer, t) * w;
  const samples = 36;
  const x0 = -0.08;
  const x1 = 1.08;
  const f = (v: number) => (Math.round(v * 100) / 100).toString();
  let px = x0 * w + dx;
  let py = hillY(layer, x0) * h;
  let d = `M${f(px)} ${f(h + 2)}L${f(px)} ${f(py)}`;
  for (let i = 1; i <= samples; i++) {
    const x = x0 + ((x1 - x0) * i) / samples;
    const nx = x * w + dx;
    const ny = hillY(layer, x) * h;
    d += `Q${f(px)} ${f(py)} ${f((px + nx) / 2)} ${f((py + ny) / 2)}`;
    px = nx;
    py = ny;
  }
  return `${d}L${f(px)} ${f(py)}L${f(x1 * w + dx)} ${f(h + 2)}Z`;
}

function Ends({ side, w, h, id }: { side: 0 | 1; w: number; h: number; id: string }) {
  const stop = side === 0 ? 0 : 4;
  const t = side;
  const track = trackFor(w, h, "compact");
  const r = h / 2;
  const kx = track.pad + track.d / 2 + side * track.travel;
  const [sx, sy] = sunAt(t);
  const [mx, my] = moonAt(t);
  const sunR = 0.135 * h;
  const moonR = 0.14 * h;
  const angle = (Math.atan2(sunAt(1)[1] * h - my * h, sunAt(1)[0] * w - mx * w) * 180) / Math.PI;
  const stars = makeStars("compact");
  const starDots = [];
  if (side === 1) {
    for (let i = 0; i < stars.length / STAR_FIELDS; i++) {
      const o = i * STAR_FIELDS;
      const opacity = (0.7 + 0.3 * Math.sin(stars[o + 5])) * (stars[o + 6] > 0.5 ? 1 : 0.82);
      starDots.push(
        <circle key={i} cx={stars[o] * w} cy={stars[o + 1] * h} r={stars[o + 2] * h} fill="#fff" opacity={opacity} />,
      );
    }
  }
  const clip = `${id}-clip-${side}`;
  const sky = `${id}-sky-${side}`;
  const corona = `${id}-corona-${side}`;
  const knob = `${id}-knob-${side}`;
  const cloudFill = `${id}-cloud-${side}`;
  const cloud = COMPACT_CLOUD;
  const ccx = cloud.x * w + shiftAt("far", t) * w * 1.5;
  const ccy = cloud.y * h;
  const ck = cloud.s * h;
  const shade = `${id}-shade-${side}`;
  return (
    <>
      <defs>
        <clipPath id={clip}>
          <rect width={w} height={h} rx={r} />
        </clipPath>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2={h * 0.68} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={keyColor("zenith", stop)} />
          <stop offset="0.42" stopColor={keyColor("upper", stop)} />
          <stop offset="0.78" stopColor={keyColor("lower", stop)} />
          <stop offset="1" stopColor={keyColor("horizon", stop)} />
        </linearGradient>
        <radialGradient id={corona}>
          <stop offset="0.23" stopColor={keyColor("sunGlow", stop)} stopOpacity="0.7" />
          <stop offset="0.5" stopColor={keyColor("sunGlow", stop)} stopOpacity="0.26" />
          <stop offset="1" stopColor={keyColor("sunGlow", stop)} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={knob} cx="0.5" cy="0.22" r="0.62" fx="0.5" fy="0.22">
          <stop offset="0" stopColor={keyColor("knob", stop)} />
          <stop offset="0.6" stopColor={keyColor("knob", stop)} />
          <stop offset="1" stopColor={keyColor("knobShade", stop)} />
        </radialGradient>
        <clipPath id={`${cloudFill}-cut`}>
          <rect x={ccx - ck} y={ccy - ck} width={ck * 2} height={ck * (1 + CLOUD_BASE)} />
        </clipPath>
        <linearGradient id={cloudFill} x1="0" y1={ccy - 0.12 * ck} x2="0" y2={ccy + CLOUD_BASE * ck} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={keyColor("cloud", stop)} />
          <stop offset="1" stopColor={keyColor("cloudShade", stop)} />
        </linearGradient>
        <radialGradient id={shade}>
          <stop offset="0.6" stopColor="#000" stopOpacity="0.3" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width={w} height={h} fill={`url(#${sky})`} />
        {starDots}
        {side === 0 ? (
          <>
            <circle cx={sx * w} cy={sy * h} r={sunR * 2.6} fill={`url(#${corona})`} />
            <circle cx={sx * w} cy={sy * h} r={sunR} fill={keyColor("sun", stop)} />
            <g fill={`url(#${cloudFill})`} opacity="0.95" clipPath={`url(#${cloudFill}-cut)`}>
              {CLOUD_PUFFS.map(([dx, dy, pr], i) => (
                <circle key={i} cx={ccx + dx * ck} cy={ccy + dy * ck} r={pr * ck} />
              ))}
              <rect x={ccx - 0.13 * ck} y={ccy} width={0.32 * ck} height={CLOUD_BASE * ck} />
            </g>
          </>
        ) : (
          <g transform={`translate(${mx * w} ${my * h}) rotate(${angle})`}>
            <circle r={moonR} fill="#c9cfdf" opacity="0.16" />
            <path
              d={`M0 ${-moonR}A${moonR} ${moonR} 0 0 1 0 ${moonR}A${moonR * 0.3} ${moonR} 0 0 0 0 ${-moonR}Z`}
              fill="#f4f1e6"
            />
          </g>
        )}
        {LAYERS.map((layer) => (
          <path key={layer} d={ridgePath(layer, w, h, t)} fill={keyColor(layer, stop)} />
        ))}
        <rect width={w} height={h * 0.3} fill="#000" opacity="0.05" />
        <circle cx={kx} cy={h / 2 + track.d * 0.06} r={track.d * 0.62} fill={`url(#${shade})`} />
      </g>
      <circle cx={kx} cy={h / 2} r={track.d / 2} fill={`url(#${knob})`} />
      <circle
        cx={kx}
        cy={h / 2}
        r={track.d / 2 - 0.3}
        fill="none"
        stroke="#000"
        strokeOpacity={side === 0 ? 0.08 : 0.2}
        strokeWidth="0.6"
      />
      <rect
        x="0.5"
        y="0.5"
        width={w - 1}
        height={h - 1}
        rx={r - 0.5}
        fill="none"
        stroke={side === 0 ? "#000" : "#fff"}
        strokeOpacity={side === 0 ? 0.1 : 0.12}
      />
    </>
  );
}

/** Both resting ends; the `dark` class on <html> decides which one shows. */
export function SwitchStill({ w, h, id, className }: { w: number; h: number; id: string; className?: string }) {
  return (
    <span aria-hidden="true" className={className}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block dark:hidden">
        <Ends side={0} w={w} h={h} id={id} />
      </svg>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="hidden dark:block">
        <Ends side={1} w={w} h={h} id={id} />
      </svg>
    </span>
  );
}
