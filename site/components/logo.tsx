// The "arsher" mark: a pixel arrowhead (an A without its crossbar, the
// archer's point) with a single pixel dot where the bar would be. Drawn on
// a 16×16 grid with crisp 2px blocks so it stays sharp at 14–16px.

const BLOCKS: ReadonlyArray<readonly [number, number, number, number]> = [
  [7, 1, 2, 2], // tip
  [5, 3, 2, 3],
  [9, 3, 2, 3],
  [3, 6, 2, 4],
  [11, 6, 2, 4],
  [1, 10, 2, 5], // feet
  [13, 10, 2, 5],
  [7, 10, 2, 2], // the dot
];

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
      shapeRendering="crispEdges"
      className={className ? `shrink-0 fill-current ${className}` : "shrink-0 fill-current"}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {BLOCKS.map(([x, y, w, h]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} />
      ))}
    </svg>
  );
}
