import type { Object3D } from 'three'
import type { CategoryId } from '@/lib/types'

/**
 * Registry of the live 3D object for each equipped slot.
 *
 * Hover highlighting and camera focus need the actual scene object for a
 * category; the store only knows product ids. Parts register themselves on mount
 * and drop out on unmount, so a removed or replaced component can never leave a
 * stale reference behind.
 */

const parts = new Map<CategoryId, Object3D>()

export function registerPart(category: CategoryId, object: Object3D): void {
  parts.set(category, object)
}

export function unregisterPart(category: CategoryId, object: Object3D): void {
  if (parts.get(category) === object) parts.delete(category)
}

export function getPartObject(category: CategoryId): Object3D | null {
  return parts.get(category) ?? null
}

export function getRegisteredParts(): Array<[CategoryId, Object3D]> {
  return [...parts.entries()]
}
