import { AlertTriangle, ArrowLeftRight, CheckCircle2, ScanSearch, Trash2 } from 'lucide-react'
import { cn } from 'cn'
import { ProductThumb } from '@/components/brand/ProductThumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CATEGORY_META } from '@/lib/catalog'
import { issuesForCategory } from '@/lib/compatibility'
import { formatPrice } from '@/lib/format'
import type { CategoryId } from '@/lib/types'
import { useBuildStore } from '@/stores/useBuildStore'
import { useCompatibility, useSelectedProduct } from '@/stores/selectors'

/**
 * Component inspector.
 *
 * Shows the selected component in full — brand, specs, dimensions and price —
 * and offers the two actions that matter: swap it (which opens the browser on the
 * same slot) or remove it.
 */
export function InspectorPanel() {
  const product = useSelectedProduct()
  const selectedCategory = useBuildStore((state) => state.selectedCategory)
  const clearSlot = useBuildStore((state) => state.clearSlot)
  const setLeftRailOpen = useBuildStore((state) => state.setLeftRailOpen)
  const revealInBrowser = useBuildStore((state) => state.revealInBrowser)

  const category = selectedCategory ?? product?.category ?? null
  const dimensions = product?.dimensionsMm

  return (
    <aside
      aria-label="Component inspector"
      className="flex h-full w-full flex-col overflow-hidden"
    >

      {product && category ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex items-start gap-3 border-b border-border/50 p-3.5">
            <ProductThumb product={product} />
            <div className="min-w-0">
              <div className="micro text-muted-foreground/70">{product.brand}</div>
              <h2 className="mt-1 text-[13px] leading-snug font-medium text-foreground">
                {product.name}
              </h2>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {CATEGORY_META[category].description}
              </div>
            </div>
          </div>

          <div className="flex items-baseline justify-between border-b border-border/50 px-3.5 py-3">
            <div>
              <div className="micro">Price</div>
              <div className="numeric mt-1 text-lg text-foreground">
                {formatPrice(product.price)}
              </div>
            </div>
            <span className="text-[9px] tracking-wide text-muted-foreground/60">
              illustrative demo price
            </span>
          </div>

          <section className="px-3.5 py-3" aria-label="Specifications">
            <div className="micro mb-2">Specifications</div>
            <dl className="space-y-1.5">
              {product.specs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex items-baseline justify-between gap-3 text-[11px]"
                >
                  <dt className="text-muted-foreground">{spec.label}</dt>
                  <dd className="numeric shrink-0 text-right text-foreground/90">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {dimensions ? (
            <>
              <Separator className="bg-border/50" />
              <section className="px-3.5 py-3" aria-label="Dimensions">
                <div className="flex items-baseline justify-between">
                  <span className="micro">Dimensions</span>
                  <span className="text-[9px] tracking-wide text-muted-foreground/60">
                    W × H × D
                  </span>
                </div>
                <div className="numeric mt-1.5 text-[12px] text-foreground/90">
                  {dimensions.width} × {dimensions.height} × {dimensions.depth} mm
                </div>
              </section>
            </>
          ) : null}

          <Separator className="bg-border/50" />
          <CompatibilitySection category={category} />

          <p className="px-3.5 pb-4 text-[11px] leading-relaxed text-muted-foreground">
            {product.blurb}
          </p>

          <div className="sticky bottom-0 grid grid-cols-2 gap-2 border-t border-border/60 bg-card/80 p-3 backdrop-blur">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setLeftRailOpen(true)
                revealInBrowser(category)
              }}
              aria-label={`Replace ${CATEGORY_META[category].singular.toLowerCase()}`}
            >
              <ArrowLeftRight className="size-3.5" />
              Replace
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => clearSlot(category)}
              aria-label={`Remove ${CATEGORY_META[category].singular.toLowerCase()}`}
            >
              <Trash2 className="size-3.5" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <div className="grid size-11 place-items-center rounded-xl border border-border/60 bg-muted/30">
            <ScanSearch className="size-5 text-muted-foreground/70" />
          </div>
          <p className="text-[13px] font-medium text-foreground/80">
            No component selected
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Click any part in the viewport to inspect its specifications, price and
            compatibility.
          </p>
        </div>
      )}
    </aside>
  )
}

/**
 * Demo compatibility checks that concern the selected component.
 *
 * Shown inline so a user inspecting a part sees why it does or does not fit,
 * labelled as demo validation because the catalogue is a sample, not a database.
 */
function CompatibilitySection({ category }: { category: CategoryId }) {
  const report = useCompatibility()
  const issues = issuesForCategory(report, category)

  return (
    <section className="px-3.5 py-3" aria-label="Compatibility">
      <div className="flex items-baseline justify-between">
        <span className="micro">Compatibility</span>
        <span className="text-[9px] tracking-wide text-muted-foreground/60">
          demo validation
        </span>
      </div>

      {issues.length === 0 ? (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-300/90">
          <CheckCircle2 className="size-3.5 shrink-0" />
          No issues flagged for this part
        </div>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {issues.map((issue) => (
            <li
              key={issue.id}
              className={cn(
                'rounded-md border px-2 py-1.5',
                issue.severity === 'error'
                  ? 'border-rose-400/30 bg-rose-400/[0.06]'
                  : 'border-amber-400/30 bg-amber-400/[0.06]',
              )}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground/90">
                <AlertTriangle
                  className={cn(
                    'size-3.5 shrink-0',
                    issue.severity === 'error'
                      ? 'text-rose-300'
                      : 'text-amber-300',
                  )}
                />
                {issue.title}
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                {issue.detail}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
