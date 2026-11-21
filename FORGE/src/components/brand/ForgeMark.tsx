/**
 * FORGE brand mark — a forged "F" cut from a gradient ingot.
 * Pure inline SVG so it stays crisp at any size and needs no asset request.
 */
export function ForgeMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="FORGE"
    >
      <defs>
        <linearGradient id="forge-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--forge-cyan)" />
          <stop offset="100%" stopColor="var(--forge-violet)" />
        </linearGradient>
      </defs>
      <rect
        x="0.75"
        y="0.75"
        width="30.5"
        height="30.5"
        rx="8"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="1.5"
      />
      <path
        d="M11.2 23.4V8.6h10.6v3.3h-7v3.4h5.9v3.3h-5.9v4.8h-3.6Z"
        fill="url(#forge-mark)"
      />
    </svg>
  )
}
