import { RoundedBox } from '@react-three/drei'
import { DIMM, DIMM_SLOT_Z, mm } from '../mounts'
import { useMaterialSet, type MaterialSpec } from '../materials'
import type { RamProduct } from '@/lib/types'

/**
 * Memory kit: one DIMM per populated slot, standing vertically the way DIMMs do
 * in a tower, with an aluminium heat spreader, gold contact edge and an
 * addressable-RGB diffuser along the top edge.
 *
 * Local space: X is the module's height off the board, Y runs along its length
 * and Z is its thickness, so a module sits at a slot's Z offset.
 */

const RAM_MATERIALS = {
  pcb: { color: '#132a1f', roughness: 0.62, metalness: 0.2 },
  spreader: { color: '#2b323c', roughness: 0.32, metalness: 0.88 },
  spreaderDark: { color: '#1d232b', roughness: 0.4, metalness: 0.72 },
  trim: { color: '#3c4553', roughness: 0.28, metalness: 0.9 },
  gold: { color: '#c9a54c', roughness: 0.28, metalness: 0.95 },
  rgb: {
    color: '#0b0f14',
    emissive: '#22d3ee',
    emissiveIntensity: 1.8,
    channel: 'rgb',
  },
} satisfies Record<string, MaterialSpec>

/** Slots used by a kit: 2 modules land in A2/B2, as the manual instructs. */
function slotsFor(modules: number): number[] {
  if (modules >= 4) return [0, 1, 2, 3]
  if (modules === 3) return [0, 1, 3]
  if (modules === 2) return [1, 3]
  return [1]
}

export function RamKit({ product }: { product: RamProduct }) {
  const materials = useMaterialSet(RAM_MATERIALS)

  const height = mm(product.dimensionsMm?.height ?? DIMM.height * 10)
  const length = mm(product.dimensionsMm?.width ?? DIMM.length * 10)
  const thickness = 0.9
  const slots = slotsFor(product.modules)

  return (
    <group>
      {slots.map((slotIndex) => (
        <group key={slotIndex} position={[0, 0, DIMM_SLOT_Z[slotIndex]]}>
          {/* PCB */}
          <mesh position={[-height / 2, 0, 0]} material={materials.pcb}>
            <boxGeometry args={[height - 0.5, length, 0.16]} />
          </mesh>

          {/* Heat spreader shells */}
          {[-1, 1].map((side) => (
            <RoundedBox
              key={side}
              args={[height - 0.6, length - 0.2, 0.34]}
              radius={0.1}
              smoothness={2}
              position={[-(height / 2 + 0.15), 0, side * (thickness / 2 - 0.08)]}
              material={side > 0 ? materials.spreader : materials.spreaderDark}
              castShadow
            />
          ))}

          {/* Contact edge */}
          <mesh position={[-0.2, 0, 0]} material={materials.gold}>
            <boxGeometry args={[0.42, length - 0.7, thickness]} />
          </mesh>

          {/* Machined trim band across the spreader */}
          <mesh
            position={[-(height - 0.75), 0, 0]}
            material={materials.trim}
          >
            <boxGeometry args={[0.5, length - 0.6, thickness + 0.16]} />
          </mesh>

          {product.hasRgb ? (
            <mesh
              position={[-(height - 0.16), 0, 0]}
              material={materials.rgb}
            >
              <boxGeometry args={[0.34, length - 1, thickness + 0.24]} />
            </mesh>
          ) : (
            <mesh position={[-(height - 0.2), 0, 0]} material={materials.spreaderDark}>
              <boxGeometry args={[0.3, length - 1, thickness + 0.12]} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}
