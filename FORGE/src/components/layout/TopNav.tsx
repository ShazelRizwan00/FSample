import { useState } from 'react'
import {
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  Save,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from 'cn'
import { ForgeMark } from '@/components/brand/ForgeMark'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useFullscreen } from '@/hooks/useFullscreen'
import { formatPrice } from '@/lib/format'
import {
  DEFAULT_BUILD_NAME,
  useBuildStore,
} from '@/stores/useBuildStore'
import {
  TOTAL_SLOTS,
  selectFilledCount,
  selectTotalPrice,
} from '@/stores/selectors'

/**
 * Top navigation: identity, build naming and the three whole-build actions.
 *
 * Save and reset write through the store (which also persists to this device) and
 * confirm with a toast, so neither can look like it did nothing.
 */
export function TopNav({
  leftOpen,
  rightOpen,
  onToggleLeft,
  onToggleRight,
}: {
  leftOpen: boolean
  rightOpen: boolean
  onToggleLeft: () => void
  onToggleRight: () => void
}) {
  const buildName = useBuildStore((state) => state.buildName)
  const setBuildName = useBuildStore((state) => state.setBuildName)
  const lastSavedAt = useBuildStore((state) => state.lastSavedAt)
  const { isFullscreen, toggle: toggleFullscreen, supported } = useFullscreen()

  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState(buildName)
  const [resetOpen, setResetOpen] = useState(false)

  const commitName = () => {
    const next = draftName.trim()
    setBuildName(next.length > 0 ? next : DEFAULT_BUILD_NAME)
    setEditingName(false)
  }

  const handleSave = () => {
    const state = useBuildStore.getState()
    state.saveBuild()
    toast.success('Build saved', {
      description: `${formatPrice(selectTotalPrice(state))} · ${selectFilledCount(state)} of ${TOTAL_SLOTS} parts · kept on this device`,
    })
  }

  const handleReset = () => {
    useBuildStore.getState().resetBuild()
    setResetOpen(false)
    toast.success('Build reset', {
      description: 'Every slot is back to the reference configuration.',
    })
  }

  const savedLabel = lastSavedAt
    ? `saved ${new Date(lastSavedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : 'not saved yet'

  return (
    <header className="enter relative z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border/70 px-3 panel">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-forge-cyan/40 to-transparent"
      />

      <div className="flex shrink-0 items-center gap-2.5 pl-1">
        <ForgeMark className="size-6 text-foreground/80" />
        <div className="leading-none">
          <div className="text-[13px] font-semibold tracking-[0.3em] text-foreground">
            FORGE
          </div>
          <div className="mt-1 hidden text-[9px] font-medium tracking-[0.22em] text-muted-foreground sm:block">
            CONFIG STUDIO
          </div>
        </div>
      </div>

      <div className="hidden h-6 w-px bg-border/80 sm:block" />

      <div className="min-w-0 leading-none">
        <div className="flex items-center gap-2">
          <span className="micro">Build</span>
          <span className="hidden text-[9px] tracking-wide text-muted-foreground/60 md:inline">
            · {savedLabel}
          </span>
        </div>

        <div className="mt-1.5 flex min-w-0 items-center">
          {editingName ? (
            <input
              autoFocus
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onBlur={commitName}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitName()
                if (event.key === 'Escape') {
                  setDraftName(buildName)
                  setEditingName(false)
                }
              }}
              aria-label="Build name"
              maxLength={40}
              className="w-[13rem] rounded border border-forge-cyan/40 bg-background/80 px-1.5 py-0.5 text-[13px] font-medium tracking-wide outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraftName(buildName)
                setEditingName(true)
              }}
              aria-label="Edit build name"
              className="max-w-[15rem] truncate rounded px-1 py-0.5 text-left text-[13px] font-medium tracking-wide text-foreground transition-colors hover:bg-muted/40"
            >
              {buildName}
            </button>
          )}
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          aria-label="Save build"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Save className="size-3.5" />
          <span className="hidden text-[11px] xl:inline">Save</span>
        </Button>

        <Dialog open={resetOpen} onOpenChange={setResetOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Reset build"
              className="gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden text-[11px] xl:inline">Reset</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset this build?</DialogTitle>
              <DialogDescription>
                Every slot returns to the reference configuration. This also
                replaces the copy kept on this device.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost" size="sm">
                  Keep build
                </Button>
              </DialogClose>
              <Button variant="destructive" size="sm" onClick={handleReset}>
                Reset to reference
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="mx-1 h-6 w-px bg-border/80" />

        <NavIcon
          label={leftOpen ? 'Hide components' : 'Show components'}
          pressed={leftOpen}
          onClick={onToggleLeft}
        >
          {leftOpen ? (
            <PanelLeftClose className="size-4" />
          ) : (
            <PanelLeftOpen className="size-4" />
          )}
        </NavIcon>

        <NavIcon
          label={rightOpen ? 'Hide inspector' : 'Show inspector'}
          pressed={rightOpen}
          onClick={onToggleRight}
        >
          {rightOpen ? (
            <PanelRightClose className="size-4" />
          ) : (
            <PanelRightOpen className="size-4" />
          )}
        </NavIcon>

        {supported ? (
          <NavIcon
            label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            pressed={isFullscreen}
            onClick={() => void toggleFullscreen()}
          >
            {isFullscreen ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </NavIcon>
        ) : null}
      </div>
    </header>
  )
}

function NavIcon({
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
          aria-pressed={pressed}
          aria-label={label}
          className={cn(
            'text-muted-foreground hover:text-foreground',
            pressed && 'text-foreground',
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}
