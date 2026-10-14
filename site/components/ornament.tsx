// The site's ornament, drawn in code. Server-safe (no hooks); styles live
// in app/globals.css under "Ornament". Usage rules are in DESIGN.md:
// one zellige frieze on the home page only, the star rule above section
// and page titles, star badges for counts on Work and Lab only, and the
// keystone as the only star that ever turns.
//
//   <Star />                      eight-pointed star (solid, outline, inlaid)
//   <StarRule />                  hairline with a star set into it
//   <StarBadge>10</StarBadge>     a count set in a terracotta star
//   <Arrow /> <Arrow external />  long fine arrow (→, or ↗ for links out)
//   <ArchFrame>…</ArchFrame>      pointed horseshoe arch window with a carved
//                                 double moulding and a star keystone
//   <ArchLines />                 just the moulding (for custom frames)
//
// The zellige frieze is <ZelligeBand /> in components/zellige-band.tsx
// (client: it follows the pointer).

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ARCH_BOX, archPath, starPoints } from "@/lib/zellige";

const STAR = starPoints(12, 12, 11);
const STAR_HEART = starPoints(12, 12, 5.2);

export type StarVariant = "solid" | "outline" | "inlaid";

/** The eight-pointed star (khatam). Paints with currentColor; decorative unless `title` is given. */
export function Star({
  size = 14,
  variant = "solid",
  className,
  style,
  title,
}: {
  size?: number;
  variant?: StarVariant;
  className?: string;
  style?: CSSProperties;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
      className={cn("shrink-0", className)}
      style={style}
    >
      {title ? <title>{title}</title> : null}
      {variant === "solid" ? (
        <polygon points={STAR} fill="currentColor" />
      ) : (
        <>
          <polygon
            points={STAR}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.4}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {variant === "inlaid" ? <polygon points={STAR_HEART} fill="currentColor" /> : null}
        </>
      )}
    </svg>
  );
}

/**
 * The page's divider: a hairline with an inlaid star set into it, near the
 * start (`align="start"`, above section and page titles) or in the middle
 * (`align="center"`, between blocks).
 */
export function StarRule({ align = "start", className }: { align?: "start" | "center"; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("star-rule", align === "center" && "star-rule--center", className)}>
      <span className="star-rule__line" />
      <Star size={12} variant="inlaid" className="star-rule__star" />
      <span className="star-rule__line" />
    </div>
  );
}

/**
 * A count set in a terracotta star, after a heading. Use it for the Work
 * and Lab counts only; other counts are quiet superscripts.
 */
export function StarBadge({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <span className="star-badge">
      {label ? <span className="sr-only">{label}</span> : null}
      <span aria-hidden={label ? true : undefined}>{children}</span>
    </span>
  );
}

/** A long, fine arrow. `external` turns it to ↗ for links that leave the site. Nudges inside `.link-arrow`. */
export function Arrow({ external = false, className }: { external?: boolean; className?: string }) {
  return (
    <svg
      width="18"
      height="12"
      viewBox="0 0 18 12"
      aria-hidden="true"
      focusable="false"
      className={cn("arrow", external && "arrow--out", className)}
    >
      <path
        d="M1 6h15M11.5 1.5 16 6l-4.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The carved double moulding that follows an arch, drawn just outside its opening. */
export function ArchLines({ className, weight = 1 }: { className?: string; weight?: number }) {
  return (
    <svg
      viewBox={`0 0 ${ARCH_BOX.width} ${ARCH_BOX.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={cn("arch-lines", className)}
    >
      <path d={archPath(3)} fill="none" stroke="currentColor" strokeWidth={weight} vectorEffect="non-scaling-stroke" />
      <path
        d={archPath(6)}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.35}
        strokeWidth={weight * 0.75}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * A pointed horseshoe arch: a 100:125 frame whose window is cut to the
 * arch (children fill the window), with the moulding and a star keystone.
 * The keystone turns 45° when the frame, or the link or button around it,
 * is hovered or focused: the one star on the site that moves.
 *
 *   <Link href="/lab/zellige/" className="block"><ArchFrame>…art…</ArchFrame></Link>
 */
export function ArchFrame({
  children,
  keystone = true,
  className,
  windowClassName,
  windowStyle,
  keystoneSize = 18,
}: {
  children?: ReactNode;
  keystone?: boolean;
  className?: string;
  windowClassName?: string;
  windowStyle?: CSSProperties;
  keystoneSize?: number;
}) {
  return (
    <div className={cn("arch-frame", className)}>
      <div className={cn("arch-window", windowClassName)} style={windowStyle}>
        {children}
      </div>
      <ArchLines />
      {keystone ? <Star size={keystoneSize} variant="inlaid" className="arch-key" /> : null}
    </div>
  );
}
