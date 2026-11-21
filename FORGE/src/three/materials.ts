import { useEffect, useMemo } from 'react'
import { Color, MeshStandardMaterial, type ColorRepresentation } from 'three'

/**
 * Shared material system for the procedural hardware.
 *
 * Each part builds one material set and every mesh inside that part reuses it,
 * which keeps draw-call state changes low and — crucially — lets the interaction
 * layer highlight a whole part by touching a handful of materials instead of
 * hundreds. Base emissive values are cached on `userData` so highlights can be
 * removed cleanly.
 */

export type MaterialChannel = 'rgb' | 'glass' | 'signal'

export type MaterialSpec = {
  color: ColorRepresentation
  roughness?: number
  metalness?: number
  emissive?: ColorRepresentation
  emissiveIntensity?: number
  opacity?: number
  transparent?: boolean
  /** Marks materials that the appearance layer animates (RGB) or toggles. */
  channel?: MaterialChannel
}

export type MaterialSet<S extends Record<string, MaterialSpec>> = {
  [K in keyof S]: MeshStandardMaterial
}

export type PartMaterial = MeshStandardMaterial

export function useMaterialSet<S extends Record<string, MaterialSpec>>(
  specs: S,
): MaterialSet<S> {
  const materials = useMemo(() => {
    const built = {} as MaterialSet<S>

    for (const key of Object.keys(specs) as (keyof S)[]) {
      const spec = specs[key]
      const material = new MeshStandardMaterial({
        color: new Color(spec.color),
        roughness: spec.roughness ?? 0.55,
        metalness: spec.metalness ?? 0.25,
        transparent: spec.transparent ?? false,
        opacity: spec.opacity ?? 1,
      })

      if (spec.emissive) {
        material.emissive = new Color(spec.emissive)
        material.emissiveIntensity = spec.emissiveIntensity ?? 1
      }

      material.userData.baseEmissive = material.emissive.clone()
      material.userData.baseEmissiveIntensity = material.emissiveIntensity
      if (spec.channel) material.userData.channel = spec.channel

      built[key] = material
    }

    return built
  }, [specs])

  useEffect(() => {
    return () => {
      for (const material of Object.values(materials)) {
        ;(material as MeshStandardMaterial).dispose()
      }
    }
  }, [materials])

  return materials
}

export type MaterialLike = MeshStandardMaterial

export function isStandardMaterial(value: unknown): value is MeshStandardMaterial {
  return value instanceof MeshStandardMaterial
}

/** Every distinct material reachable from a subtree, without duplicates. */
export function collectMaterials(root: import('three').Object3D): MeshStandardMaterial[] {
  const found = new Set<MeshStandardMaterial>()

  root.traverse((object) => {
    const mesh = object as import('three').Mesh
    if (!mesh.isMesh) return
    const material = mesh.material
    if (Array.isArray(material)) {
      for (const entry of material) {
        if (isStandardMaterial(entry)) found.add(entry)
      }
    } else if (isStandardMaterial(material)) {
      found.add(material)
    }
  })

  return [...found]
}

/**
 * Applies or clears a hover/selection tint across a part's materials.
 * Called from the interaction layer via refs rather than re-rendering meshes.
 * Glass is skipped: tinting a transparent pane reads as a lighting bug, not a
 * selection cue.
 */
export function setHighlight(
  materials: MeshStandardMaterial[],
  active: boolean,
  color: ColorRepresentation,
  intensity = 0.42,
): void {
  for (const material of materials) {
    if (material.userData.channel === 'glass') continue

    const base = material.userData.baseEmissive as Color | undefined
    if (!active) {
      if (base) material.emissive.copy(base)
      material.emissiveIntensity =
        (material.userData.baseEmissiveIntensity as number | undefined) ?? 1
      continue
    }

    material.emissive.set(color)
    material.emissiveIntensity = intensity
  }
}
