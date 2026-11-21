import { useEffect, useState } from 'react'
import {
  Box,
  CircuitBoard,
  Cpu,
  Fan,
  Gpu,
  HardDrive,
  MemoryStick,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { cn } from 'cn'
import { ProductThumb } from '@/components/brand/ProductThumb'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  PRODUCTS_BY_CATEGORY,
  getSlotProduct,
} from '@/lib/catalog'
import { formatPrice } from '@/lib/format'
import type { CategoryId, Product } from '@/lib/types'
import { useBuildStore } from '@/stores/useBuildStore'

const ICONS: Record<string, LucideIcon> = {
  Box,
  CircuitBoard,
  Cpu,
  Gpu,
  MemoryStick,
  Fan,
  HardDrive,
  Zap,
  Wind,
}

/**
 * Component browser: one accordion section per slot, each listing the available
 * products with a drawn thumbnail, price and equipped state.
 *
 * The open section follows the 3D selection, so picking a part in the viewport
 * brings its alternatives straight into view — the browser and the scene always
 * describe the same slot.
 */
export function ComponentBrowser() {
  const slots = useBuildStore((state) => state.slots)
  const selectedCategory = useBuildStore((state) => state.selectedCategory)
  const equip = useBuildStore((state) => state.equip)
  const clearSlot = useBuildStore((state) => state.clearSlot)
  const selectCategory = useBuildStore((state) => state.selectCategory)
  const revealRequest = useBuildStore((state) => state.revealRequest)

  const [openCategory, setOpenCategory] = useState<string>('gpu')
  const [lastSignal, setLastSignal] = useState('')

  // Selecting a part in 3D, or pressing Replace, brings that slot into view.
  // Adjusting state during render (rather than in an effect) keeps the accordion
  // in step with the store in a single pass.
  const signal = `${selectedCategory ?? ''}|${revealRequest?.token ?? 0}`
  if (signal !== lastSignal) {
    setLastSignal(signal)
    const target = revealRequest?.category ?? selectedCategory
    if (target) setOpenCategory(target)
  }

  useEffect(() => {
    if (!revealRequest) return
    document
      .getElementById(`browser-${revealRequest.category}`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [revealRequest])

  const filled = CATEGORY_ORDER.filter(
    (category) => getSlotProduct(slots, category) !== null,
  ).length

  return (
    <aside
      aria-label="Component browser"
      className="flex h-full w-full flex-col overflow-hidden border-r border-border/70 panel"
    >
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border/60 px-3.5">
        <span className="micro">Components</span>
        <span className="numeric text-[10px] text-muted-foreground/70">
          {filled} / {CATEGORY_ORDER.length}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1.5">
        <Accordion
          type="single"
          collapsible
          value={openCategory}
          onValueChange={setOpenCategory}
          className="w-full"
        >
          {CATEGORY_ORDER.map((category) => (
            <CategorySection
              key={category}
              category={category}
              equipped={getSlotProduct(slots, category)}
              isSelected={selectedCategory === category}
              onEquip={(product) => equip(category, product.id)}
              onRemove={() => clearSlot(category)}
              onFocus={() => selectCategory(category)}
            />
          ))}
        </Accordion>
      </div>
    </aside>
  )
}

function CategorySection({
  category,
  equipped,
  isSelected,
  onEquip,
  onRemove,
  onFocus,
}: {
  category: CategoryId
  equipped: Product | null
  isSelected: boolean
  onEquip: (product: Product) => void
  onRemove: () => void
  onFocus: () => void
}) {
  const meta = CATEGORY_META[category]
  const Icon = ICONS[meta.icon] ?? Box
  const products = PRODUCTS_BY_CATEGORY[category]

  return (
    <div id={`browser-${category}`} data-slot="browser-section">
      <AccordionItem value={category} className="border-b border-border/40 last:border-b-0">
        <AccordionTrigger
          className={cn(
            'items-center gap-2 rounded-md px-2 py-2 hover:no-underline',
            isSelected && 'text-foreground',
          )}
          onClick={onFocus}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
            <span
              className={cn(
                'grid size-7 shrink-0 place-items-center rounded-md border',
                isSelected
                  ? 'border-forge-cyan/50 bg-forge-cyan/10 text-forge-cyan'
                  : 'border-border/60 bg-muted/30 text-muted-foreground',
              )}
            >
              <Icon className="size-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-medium tracking-wide">
                {meta.label}
              </span>
              <span className="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground">
                {equipped ? equipped.name : 'Empty slot'}
              </span>
            </span>
          </span>
        </AccordionTrigger>

        <AccordionContent className="pb-2">
          <div className="flex items-center justify-between px-2 pb-1.5">
            <span className="micro text-muted-foreground/60">
              {products.length} option{products.length === 1 ? '' : 's'}
            </span>
            <Button
              variant="ghost"
              size="xs"
              className="h-5 px-1.5 text-[10px] tracking-wide text-muted-foreground hover:text-destructive"
              onClick={onRemove}
              disabled={!equipped}
            >
              Remove
            </Button>
          </div>

          <ul className="space-y-1 px-1">
            {products.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => onEquip(product)}
                  aria-pressed={equipped?.id === product.id}
                  aria-label={`Equip ${product.name}`}
                  data-equipped={equipped?.id === product.id}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg border p-1.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                    equipped?.id === product.id
                      ? 'border-forge-cyan/45 bg-forge-cyan/[0.07]'
                      : 'border-border/50 hover:border-border hover:bg-muted/40',
                  )}
                >
                  <ProductThumb product={product} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium">
                      {product.name}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5">
                      <span className="micro text-muted-foreground/70">
                        {product.brand}
                      </span>
                      {equipped?.id === product.id ? (
                        <span className="rounded-sm bg-forge-cyan/15 px-1 py-0.5 text-[9px] font-semibold tracking-[0.12em] text-forge-cyan uppercase">
                          Equipped
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <span className="numeric shrink-0 text-[11px] text-muted-foreground">
                    {formatPrice(product.price)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </div>
  )
}
