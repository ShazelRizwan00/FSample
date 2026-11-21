import { useEffect } from 'react'
import { collectMaterials, setHighlight } from './materials'
import { getPartObject, getRegisteredParts } from './partRegistry'
import { useBuildStore } from '@/stores/useBuildStore'
import { CATEGORY_IDS } from '@/lib/types'

const HOVER_COLOR = '#5bc8ee'
const SELECT_COLOR = '#0e7f96'

/**
 * Applies hover/selection tint to the live geometry and owns the pointer cursor.
 *
 * Driven by store state rather than by the parts themselves so that a replaced
 * component is highlighted the moment its new geometry mounts.
 */
export function HighlightLayer() {
  const hovered = useBuildStore((state) => state.hoveredCategory)
  const selected = useBuildStore((state) => state.selectedCategory)
  const slots = useBuildStore((state) => state.slots)

  useEffect(() => {
    for (const category of CATEGORY_IDS) {
      const object = getPartObject(category)
      if (!object) continue

      const isSelected = category === selected
      const isHovered = category === hovered
      const active = isSelected || isHovered

      setHighlight(
        collectMaterials(object),
        active,
        isSelected ? SELECT_COLOR : HOVER_COLOR,
        isSelected ? 0.22 : 0.1,
      )
    }

    document.body.style.cursor = hovered ? 'pointer' : ''

    return () => {
      document.body.style.cursor = ''
    }
  }, [hovered, selected, slots])

  return null
}

/** Restores every registered part to its base material state. */
export function clearHighlights(): void {
  for (const [, object] of getRegisteredParts()) {
    setHighlight(collectMaterials(object), false, HOVER_COLOR)
  }
}
