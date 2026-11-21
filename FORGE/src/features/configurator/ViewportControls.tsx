import { Crosshair, DoorOpen, Layers, RotateCcw } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CATEGORY_META } from '@/lib/catalog'
import { useBuildStore } from '@/stores/useBuildStore'
import { useSelectedProduct } from '@/stores/selectors'

/**
 * Viewport chrome: case interactions (glass panel, exploded view) and camera
 * actions (focus the selection, return to the establishing shot), plus a readout
 * of what is currently selected.
 */
export function ViewportControls() {
  const selectedCategory = useBuildStore((state) => state.selectedCategory)
  const selectedProduct = useSelectedProduct()
  const panelOpen = useBuildStore((state) => state.panelOpen)
  const exploded = useBuildStore((state) => state.exploded)
  const togglePanel = useBuildStore((state) => state.togglePanel)
  const toggleExploded = useBuildStore((state) => state.toggleExploded)
  const requestFocus = useBuildStore((state) => state.requestFocus)
  const resetCamera = useBuildStore((state) => state.resetCamera)

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
      <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background/70 p-1 backdrop-blur">
        <ControlButton
          label={panelOpen ? 'Close side panel' : 'Open side panel'}
          pressed={panelOpen}
          onClick={togglePanel}
        >
          <DoorOpen className="size-4" />
        </ControlButton>

        <ControlButton
          label="Exploded view"
          pressed={exploded}
          onClick={toggleExploded}
        >
          <Layers className="size-4" />
        </ControlButton>

        <div className="h-5 w-px bg-border/70" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (selectedCategory) requestFocus(selectedCategory)
              }}
              disabled={!selectedCategory}
              aria-label="Focus selected component"
            >
              <Crosshair className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {selectedCategory
              ? `Focus ${CATEGORY_META[selectedCategory].singular.toLowerCase()}`
              : 'Select a component to focus'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={resetCamera}
              aria-label="Reset view"
            >
              <RotateCcw className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Reset view</TooltipContent>
        </Tooltip>
      </div>

      <div className="max-w-[15rem] truncate rounded-md border border-border/50 bg-background/60 px-2 py-1 text-[11px] text-muted-foreground backdrop-blur">
        {selectedProduct ? (
          <>
            <span className="micro mr-1.5">
              {CATEGORY_META[selectedProduct.category].singular}
            </span>
            {selectedProduct.name}
          </>
        ) : (
          <span className="text-muted-foreground/70">No selection</span>
        )}
      </div>
    </div>
  )
}

function ControlButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string
  pressed: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          aria-label={label}
          aria-pressed={pressed}
          className={cn(
            'size-8',
            pressed
              ? 'bg-forge-cyan/15 text-forge-cyan hover:text-forge-cyan'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  )
}
