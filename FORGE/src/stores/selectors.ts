import { useMemo } from 'react'
import { CATEGORY_ORDER, getProduct, getSlotProduct } from '@/lib/catalog'
import { evaluateCompatibility } from '@/lib/compatibility'
import type {
  CategoryId,
  CompatibilityReport,
  EquippedPart,
  Product,
} from '@/lib/types'
import { useBuildStore, type BuildState } from './useBuildStore'

/** Number of slots a complete build fills (fans included). */
export const TOTAL_SLOTS = CATEGORY_ORDER.length

export function selectTotalPrice(state: BuildState): number {
  return CATEGORY_ORDER.reduce((total, category) => {
    return total + (getSlotProduct(state.slots, category)?.price ?? 0)
  }, 0)
}

export function selectFilledCount(state: BuildState): number {
  return CATEGORY_ORDER.filter(
    (category) => getSlotProduct(state.slots, category) !== null,
  ).length
}

export function selectEquippedParts(state: BuildState): EquippedPart[] {
  return CATEGORY_ORDER.flatMap((category) => {
    const product = getSlotProduct(state.slots, category)
    return product ? [{ category, product }] : []
  })
}

export function selectSelectedProduct(state: BuildState): Product | null {
  if (!state.selectedCategory) return null
  return getSlotProduct(state.slots, state.selectedCategory)
}

/**
 * Derived values are computed in hooks rather than inline selectors: the
 * compatibility report and parts list are fresh objects, and returning a new
 * snapshot from a Zustand selector on every read would re-render forever.
 */
export function useTotalPrice(): number {
  return useBuildStore(selectTotalPrice)
}

export function useFilledCount(): number {
  return useBuildStore(selectFilledCount)
}

export function useSlotProduct(category: CategoryId): Product | null {
  const id = useBuildStore((state) => state.slots[category])
  return getProduct(id)
}

export function useEquippedParts(): EquippedPart[] {
  const slots = useBuildStore((state) => state.slots)
  return useMemo(
    () =>
      CATEGORY_ORDER.flatMap((category) => {
        const product = getSlotProduct(slots, category)
        return product ? [{ category, product }] : []
      }),
    [slots],
  )
}

export function useCompatibility(): CompatibilityReport {
  const slots = useBuildStore((state) => state.slots)
  return useMemo(() => evaluateCompatibility(slots), [slots])
}

export function useSelectedProduct(): Product | null {
  const selectedCategory = useBuildStore((state) => state.selectedCategory)
  const slots = useBuildStore((state) => state.slots)
  return useMemo(
    () => (selectedCategory ? getSlotProduct(slots, selectedCategory) : null),
    [selectedCategory, slots],
  )
}
