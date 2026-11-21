import { RoundedBox } from '@react-three/drei'
import { useMaterialSet, type MaterialSpec } from '../materials'
import type { CpuProduct } from '@/lib/types'

/**
 * Processor seated in the socket: green substrate, chamfered nickel IHS and the
 * gold corner index. Local space lies flat on the board — the package thickness
 * runs along −X and the pins face the socket at +X.
 */

const CPU_MATERIALS = {
  substrate: { color: '#14251c', roughness: 0.62, metalness: 0.25 },
  ihs: { color: '#b7bcc4', roughness: 0.24, metalness: 0.95 },
  ihsFace: { color: '#9aa1aa', roughness: 0.32, metalness: 0.92 },
  gold: { color: '#c9a54c', roughness: 0.3, metalness: 0.95 },
  seal: { color: '#20262e', roughness: 0.7, metalness: 0.2 },
} satisfies Record<string, MaterialSpec>

export function Cpu({ product }: { product: CpuProduct }) {
  const materials = useMaterialSet(CPU_MATERIALS)
  const size = product.socket === 'AM5' ? 4 : 3.7

  return (
    <group>
      <mesh position={[0.1, 0, 0]} material={materials.substrate}>
        <boxGeometry args={[0.2, size + 0.6, size + 0.6]} />
      </mesh>

      <mesh position={[0.02, 0, 0]} material={materials.seal}>
        <boxGeometry args={[0.14, size + 0.1, size + 0.1]} />
      </mesh>

      <RoundedBox
        args={[0.62, size, size]}
        radius={0.1}
        smoothness={3}
        position={[-0.32, 0, 0]}
        material={materials.ihs}
        castShadow
      />

      <mesh position={[-0.64, 0, 0]} material={materials.ihsFace}>
        <boxGeometry args={[0.04, size - 1.1, size - 1.1]} />
      </mesh>

      {/* Gold index triangle in the corner, as on a real AM5 package. */}
      <mesh position={[-0.66, size / 2 - 0.55, size / 2 - 0.55]} material={materials.gold}>
        <boxGeometry args={[0.03, 0.5, 0.5]} />
      </mesh>

      {/* Laser-etched label band */}
      <mesh position={[-0.665, -size / 2 + 0.85, 0]} material={materials.gold}>
        <boxGeometry args={[0.02, 0.28, size - 1.8]} />
      </mesh>
    </group>
  )
}
