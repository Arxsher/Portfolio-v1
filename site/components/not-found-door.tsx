// The 404's closed door: a pointed horseshoe arch (<ArchFrame>) filled with
// a shut double door, painted cobalt, studded in brass along its arch and
// across its rail, two ring knockers at the seam and a thin line of warm
// light along the threshold. Drawn in code; server-safe and static. The
// keystone turns when the door is hovered, like every arch on the site.
// Decorative: the page's heading says the door is closed.

import { ArchFrame } from "@/components/ornament";
import { cn } from "@/lib/cn";
import { ARCH_BOX, archPath } from "@/lib/zellige";

export function ClosedDoor({ className }: { className?: string }) {
  const { width, height } = ARCH_BOX;
  return (
    <div aria-hidden="true" className={cn("flex flex-col items-center", className)}>
      <ArchFrame className="w-full" windowClassName="bg-z-deep">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
          className="absolute inset-0 size-full"
        >
          {/* the two leaves */}
          <rect width={width} height={height} className="fill-z-blue" />
          {/* a carved panel following the arch, and the seam between the leaves */}
          <path d={`${archPath(-5)}`} fill="none" strokeWidth={1.1} className="stroke-z-deep" />
          <line x1={50} x2={50} y1={14} y2={height} strokeWidth={1.1} className="stroke-z-deep" />
          {/* brass studs: along the arch, and two rails */}
          <path
            d={archPath(-9)}
            fill="none"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeDasharray="0 4.6"
            className="stroke-z-ochre"
          />
          {[58, 96].map((y) => (
            <line
              key={y}
              x1={25}
              x2={75}
              y1={y}
              y2={y}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeDasharray="0 4.6"
              className="stroke-z-ochre"
            />
          ))}
          {/* ring knockers on their plates */}
          {[44.5, 55.5].map((x) => (
            <g key={x}>
              <circle cx={x} cy={74} r={1.5} className="fill-z-ochre" />
              <circle cx={x} cy={78.2} r={3.1} fill="none" strokeWidth={0.9} className="stroke-z-ochre" />
            </g>
          ))}
          {/* warm light under the door */}
          <rect x={14} y={height - 2.2} width={72} height={2.2} className="fill-z-ochre" opacity={0.9} />
        </svg>
      </ArchFrame>
      {/* the sill */}
      <span className="mt-1.5 block h-px w-[112%] bg-line-firm" />
      <span className="mt-[3px] block h-px w-[104%] bg-line" />
    </div>
  );
}
