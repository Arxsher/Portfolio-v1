// Ashh's mark: a soft, chubby five-pointed star (the ★ from his bio) with
// two oval eyes. The corners are rounded and the eyes are cut out of the
// shape (even-odd fill), so the mark is one path in currentColor and the
// eyes show whatever sits behind it. Drawn on a 16×16 grid.

const STAR =
  "M8.75 2.51L9.92 4.64Q10.38 5.47 11.31 5.65L13.71 6.11Q15.23 6.4 14.17 7.53L12.5 9.31Q11.85 10 11.97 10.94L12.27 13.36Q12.47 14.9 11.06 14.24L8.86 13.2Q8 12.8 7.14 13.2L4.94 14.24Q3.53 14.9 3.73 13.36L4.03 10.94Q4.15 10 3.5 9.31L1.83 7.53Q0.77 6.4 2.29 6.11L4.69 5.65Q5.62 5.47 6.08 4.64L7.25 2.51Q8 1.15 8.75 2.51Z" +
  "M5.57 8.55a0.78 1.08 0 1 0 1.56 0a0.78 1.08 0 1 0 -1.56 0Z" +
  "M8.87 8.55a0.78 1.08 0 1 0 1.56 0a0.78 1.08 0 1 0 -1.56 0Z";

export function Logo({
  className,
  size = 16,
  title,
}: {
  className?: string;
  size?: number;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={className ? `shrink-0 fill-current ${className}` : "shrink-0 fill-current"}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <path d={STAR} fillRule="evenodd" />
    </svg>
  );
}

export const LOGO_PATH = STAR;
