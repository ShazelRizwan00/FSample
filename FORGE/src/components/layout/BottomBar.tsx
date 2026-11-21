import {
  AlertTriangle,
  CheckCircle2,
  ChevronUp,
  XCircle,
} from 'lucide-react'
import { cn } from 'cn'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { DEMO_VALIDATION_NOTE } from '@/lib/compatibility'
import { formatPrice } from '@/lib/format'
import type { CompatibilityStatus } from '@/lib/types'
import {
  TOTAL_SLOTS,
  useCompatibility,
  useFilledCount,
  useTotalPrice,
} from '@/stores/selectors'

const STATUS_META: Record<
  CompatibilityStatus,
  { label: string; icon: typeof CheckCircle2; tone: string }
> = {
  compatible: {
    label: 'Compatible',
    icon: CheckCircle2,
    tone: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-300',
  },
  warning: {
    label: 'Warnings',
    icon: AlertTriangle,
    tone: 'border-amber-400/35 bg-amber-400/10 text-amber-300',
  },
  incompatible: {
    label: 'Incompatible',
    icon: XCircle,
    tone: 'border-rose-400/35 bg-rose-400/10 text-rose-300',
  },
}

/**
 * Bottom bar: live build economics and the compatibility verdict.
 *
 * The verdict is the entry point to the demo checks — clicking it lists every
 * issue with the reasoning behind it, and always restates that this is demo-level
 * validation rather than a hardware database.
 */
export function BottomBar() {
  const total = useTotalPrice()
  const filled = useFilledCount()
  const report = useCompatibility()
  const status = STATUS_META[report.status]
  const StatusIcon = status.icon

  return (
    <footer className="enter relative z-20 flex h-14 shrink-0 items-center gap-5 border-t border-border/70 px-4 panel" style={{ animationDelay: '180ms' }}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-forge-violet/40 to-transparent"
      />

      <div className="flex items-baseline gap-2.5">
        <span className="micro">Total</span>
        <span
          className="numeric text-lg font-medium text-foreground"
          data-testid="build-total"
        >
          {formatPrice(total)}
        </span>
        <span className="hidden text-[10px] tracking-wide text-muted-foreground/70 sm:inline">
          illustrative demo pricing
        </span>
      </div>

      <div className="h-6 w-px bg-border/80" />

      <div className="flex items-baseline gap-2.5">
        <span className="micro">Parts</span>
        <span className="numeric text-sm text-muted-foreground">
          <span className="text-foreground">{filled}</span> / {TOTAL_SLOTS}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Compatibility: ${status.label.toLowerCase()}`}
              className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors',
                status.tone,
              )}
            >
              <StatusIcon className="size-3.5" />
              <span className="tracking-wide">{status.label}</span>
              {report.issues.length > 0 ? (
                <span className="numeric text-[10px] opacity-80">
                  {report.issues.length}
                </span>
              ) : null}
              <ChevronUp className="size-3 opacity-60" />
            </button>
          </PopoverTrigger>

          <PopoverContent side="top" align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
              <span className="micro">Compatibility</span>
              <span
                className={cn(
                  'flex items-center gap-1.5 text-[10px] font-medium',
                  report.status === 'compatible'
                    ? 'text-emerald-300'
                    : report.status === 'warning'
                      ? 'text-amber-300'
                      : 'text-rose-300',
                )}
              >
                <StatusIcon className="size-3" />
                {status.label}
              </span>
            </div>

            <ul
              className="max-h-64 space-y-0.5 overflow-y-auto p-1.5"
              aria-label="Compatibility issues"
            >
              {report.issues.length === 0 ? (
                <li className="px-2 py-2 text-[11px] text-muted-foreground">
                  Every demo check passes for this configuration.
                </li>
              ) : (
                report.issues.map((issue) => (
                  <li
                    key={issue.id}
                    className="flex gap-2 rounded-md px-2 py-1.5"
                  >
                    <AlertTriangle
                      className={cn(
                        'mt-0.5 size-3.5 shrink-0',
                        issue.severity === 'error'
                          ? 'text-rose-300'
                          : 'text-amber-300',
                      )}
                    />
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium text-foreground/90">
                        {issue.title}
                      </div>
                      <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                        {issue.detail}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>

            <p className="border-t border-border/60 px-3 py-2 text-[9.5px] leading-relaxed text-muted-foreground/70">
              {DEMO_VALIDATION_NOTE}
            </p>
          </PopoverContent>
        </Popover>
      </div>
    </footer>
  )
}
