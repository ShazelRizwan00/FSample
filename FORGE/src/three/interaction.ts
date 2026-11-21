import { useMemo } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import type { Object3D } from 'three'
import { CATEGORY_IDS, type CategoryId } from '@/lib/types'
import { useBuildStore } from '@/stores/useBuildStore'

/**
 * Pointer interaction for the assembled rig.
 *
 * Events are handled once on the rig root rather than per part: the hit mesh is
 * resolved up to the nearest `userData.category` ancestor, which keeps highlight
 * state in a single place and avoids hover flicker when the pointer crosses
 * between meshes that belong to the same component.
 */

export function findPartCategory(object: Object3D | null): CategoryId | null {
  let current: Object3D | null = object

  while (current) {
    const category = current.userData?.category as CategoryId | undefined
    if (category && (CATEGORY_IDS as readonly string[]).includes(category)) {
      return category
    }
    current = current.parent
  }

  return null
}

export function useRigInteraction() {
  const setHovered = useBuildStore((state) => state.setHovered)
  const selectCategory = useBuildStore((state) => state.selectCategory)
  const requestFocus = useBuildStore((state) => state.requestFocus)

  return useMemo(
    () => ({
      onPointerMove: (event: ThreeEvent<PointerEvent>) => {
        setHovered(findPartCategory(event.object))
      },
      onPointerOut: () => {
        setHovered(null)
      },
      onClick: (event: ThreeEvent<MouseEvent>) => {
        selectCategory(findPartCategory(event.object))
      },
      onDoubleClick: (event: ThreeEvent<MouseEvent>) => {
        const category = findPartCategory(event.object)
        if (category) requestFocus(category)
      },
    }),
    [setHovered, selectCategory, requestFocus],
  )
}
