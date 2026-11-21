import { ForgeMark } from '@/components/brand/ForgeMark'
import { Studio } from '@/three/Studio'

/**
 * Centre stage frame. The WebGL canvas mounts inside this region; the frame owns
 * the studio backdrop, vignette and corner registration marks so the viewport
 * reads as a product-design stage rather than a page section.
 */
export function ViewportStage({ children }: { children?: React.ReactNode }) {
  return (
    <section
      aria-label="3D viewport"
      className="relative min-w-0 flex-1 overflow-hidden stage-grid"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,transparent_0%,var(--background)_100%)]"
      />
      <CornerMarks />

      <div className="absolute inset-0">
        {children ?? <Studio />}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-4">
        <div className="flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1.5 backdrop-blur">
          <ForgeMark className="size-3.5 text-muted-foreground/60" />
          <span className="micro text-muted-foreground/70">
            Drag to orbit · Wheel to zoom · Right-drag to pan · Double-click to focus
          </span>
        </div>
      </div>
    </section>
  )
}

function CornerMarks() {
  const positions = [
    'left-4 top-4 border-l border-t',
    'right-4 top-4 border-r border-t',
    'left-4 bottom-4 border-l border-b',
    'right-4 bottom-4 border-r border-b',
  ]

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {positions.map((position) => (
        <span
          key={position}
          className={`absolute size-4 border-forge-line-strong ${position}`}
        />
      ))}
    </div>
  )
}
