// Turn icons for the city's tray (same grid and stroke as lab-icons.tsx:
// 16×16, 1.5px round strokes, currentColor, decorative).

type Props = { size?: number; className?: string };

function Turn({ size = 16, className, flip }: Props & { flip?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className ? `shrink-0 ${className}` : "shrink-0"}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <g stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        {/* A quarter-and-a-bit arc around a small iso block. */}
        <path d="M3.1 6.4A5.25 5.25 0 0 1 12.9 5.6" />
        <path d="M3 3.4v3.1h3.1" />
        <path d="M8 8.4l2.6 1.3L8 11l-2.6-1.3z" />
        <path d="M5.4 9.7v1.6L8 12.6l2.6-1.3V9.7" />
      </g>
    </svg>
  );
}

/** Turn the city a quarter to the left (anticlockwise seen from above). */
export function TurnLeft(props: Props) {
  return <Turn {...props} />;
}

/** Turn the city a quarter to the right. */
export function TurnRight(props: Props) {
  return <Turn {...props} flip />;
}
