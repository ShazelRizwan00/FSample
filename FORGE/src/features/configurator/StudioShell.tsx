import { useEffect } from 'react'
import { cn } from 'cn'
import { BottomBar } from '@/components/layout/BottomBar'
import { TopNav } from '@/components/layout/TopNav'
import { ViewportStage } from '@/components/layout/ViewportStage'
import { useIsCompactLayout } from '@/hooks/useMediaQuery'
import { Studio } from '@/three/Studio'
import { useBuildStore } from '@/stores/useBuildStore'
import { ComponentBrowser } from './ComponentBrowser'
import { RightRail } from './RightRail'
import { ViewportControls } from './ViewportControls'

const LEFT_RAIL_WIDTH = 300
const RIGHT_RAIL_WIDTH = 340

/**
 * The studio shell: a fixed, non-scrolling three-pane layout where the viewport
 * always owns the remaining space between two independently collapsible rails.
 *
 * Below the `lg` breakpoint the rails become overlay drawers, so the viewport
 * keeps the full width instead of being squeezed to nothing.
 *
 * Rail visibility lives in the build store so the inspector's "Replace" action can
 * open the browser itself.
 */
export function StudioShell() {
  const leftOpen = useBuildStore((state) => state.leftRailOpen)
  const rightOpen = useBuildStore((state) => state.rightRailOpen)
  const toggleLeft = useBuildStore((state) => state.toggleLeftRail)
  const toggleRight = useBuildStore((state) => state.toggleRightRail)
  const compact = useIsCompactLayout()

  const nav = (
    <TopNav
      leftOpen={leftOpen}
      rightOpen={rightOpen}
      onToggleLeft={toggleLeft}
      onToggleRight={toggleRight}
    />
  )

  const stage = (
    <ViewportStage>
      <Studio />
      <ViewportControls />
    </ViewportStage>
  )

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      {nav}

      {compact ? (
        <div className="relative flex min-h-0 flex-1">
          {stage}
          <OverlayDrawer
            side="left"
            open={leftOpen}
            width={LEFT_RAIL_WIDTH}
            onClose={toggleLeft}
          >
            <ComponentBrowser />
          </OverlayDrawer>
          <OverlayDrawer
            side="right"
            open={rightOpen}
            width={RIGHT_RAIL_WIDTH}
            onClose={toggleRight}
          >
            <RightRail />
          </OverlayDrawer>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <CollapsibleRail open={leftOpen} width={LEFT_RAIL_WIDTH} side="left">
            <ComponentBrowser />
          </CollapsibleRail>

          {stage}

          <CollapsibleRail open={rightOpen} width={RIGHT_RAIL_WIDTH} side="right">
            <RightRail />
          </CollapsibleRail>
        </div>
      )}

      <BottomBar />
    </div>
  )
}

function CollapsibleRail({
  open,
  width,
  side,
  children,
}: {
  open: boolean
  width: number
  side: 'left' | 'right'
  children: React.ReactNode
}) {
  return (
    <div
      className="enter shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ width: open ? width : 0, animationDelay: side === 'left' ? '60ms' : '120ms' }}
      inert={!open}
      aria-hidden={!open}
      data-side={side}
      data-open={open}
    >
      <div style={{ width }} className="h-full">
        {children}
      </div>
    </div>
  )
}

/** Compact-layout drawer: slides over the stage with a dismissable backdrop. */
function OverlayDrawer({
  side,
  open,
  width,
  onClose,
  children,
}: {
  side: 'left' | 'right'
  open: boolean
  width: number
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          'absolute inset-0 z-30 bg-black/55 transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <div
        data-drawer={side}
        data-open={open}
        inert={!open}
        aria-hidden={!open}
        className={cn(
          'absolute inset-y-0 z-40 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          side === 'left' ? 'left-0' : 'right-0',
          open
            ? 'translate-x-0'
            : side === 'left'
              ? '-translate-x-full'
              : 'translate-x-full',
        )}
        style={{ width }}
      >
        <div className="h-full shadow-2xl shadow-black/60">{children}</div>
      </div>
    </>
  )
}
