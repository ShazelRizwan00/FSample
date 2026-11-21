import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { MeshStandardMaterial } from 'three'
import { collectMaterials } from './materials'
import { rgbColorAt, rgbEmissiveIntensity } from './appearance'
import { explodeState, tweenExploded } from './explode'
import { useBuildStore } from '@/stores/useBuildStore'

/**
 * Appearance rig, inside the canvas.
 *
 * RGB diffusers are animated per frame in rainbow mode and set once per change
 * otherwise. Materials are re-collected whenever the build changes, so a swapped
 * component's new diffusers join the animation immediately.
 */
export function AppearanceRig() {
  const scene = useThree((state) => state.scene)
  const slots = useBuildStore((state) => state.slots)
  const appearance = useBuildStore((state) => state.appearance)

  const rgbMaterials = useRef<MeshStandardMaterial[]>([])

  useEffect(() => {
    rgbMaterials.current = collectMaterials(scene).filter(
      (material) => material.userData.channel === 'rgb',
    )
  }, [scene, slots])

  useEffect(() => {
    applyRgb(
      rgbMaterials.current,
      appearance.rgbMode,
      appearance.rgbColor,
      appearance.rgbIntensity,
      0,
    )
  }, [appearance.rgbMode, appearance.rgbColor, appearance.rgbIntensity, slots])

  useFrame((state) => {
    if (appearance.rgbMode !== 'rainbow') return
    applyRgb(
      rgbMaterials.current,
      appearance.rgbMode,
      appearance.rgbColor,
      appearance.rgbIntensity,
      state.clock.elapsedTime,
    )
  })

  return null
}

function applyRgb(
  materials: MeshStandardMaterial[],
  mode: 'off' | 'static' | 'rainbow',
  color: string,
  intensity: number,
  elapsed: number,
): void {
  const hex = rgbColorAt(mode, color, elapsed)

  for (const material of materials) {
    if (!hex) {
      material.emissiveIntensity = 0
      continue
    }
    const base =
      (material.userData.baseEmissiveIntensity as number | undefined) ?? 1.4
    material.emissive.set(hex)
    material.emissiveIntensity = rgbEmissiveIntensity(mode, intensity, base)
  }
}

/**
 * Owns the single exploded-view tween. Slots read `explodeState` in their own
 * frame loop, so the explosion composes with install and hinge animations.
 */
export function ExplodeRig() {
  const exploded = useBuildStore((state) => state.exploded)
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      explodeState.value = exploded ? 1 : 0
      return
    }
    tweenExploded(exploded)
  }, [exploded])

  return null
}
