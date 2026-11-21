import { mm } from '../mounts'
import { useMaterialSet, type MaterialSpec } from '../materials'
import { Label } from '../decals'
import type { StorageProduct } from '@/lib/types'

/**
 * M.2 drive seated flat on the board: green PCB, flash packages, controller and
 * a brushed heatshield edge. Local space lies parallel to the motherboard, with
 * the drive's length running along −Z.
 */

const STORAGE_MATERIALS = {
  pcb: { color: '#123024', roughness: 0.62, metalness: 0.22 },
  chip: { color: '#1d242c', roughness: 0.5, metalness: 0.4 },
  shield: { color: '#2f3742', roughness: 0.3, metalness: 0.86 },
  gold: { color: '#c9a54c', roughness: 0.3, metalness: 0.95 },
  label: { color: '#e6ecf4', roughness: 0.8, metalness: 0.05 },
} satisfies Record<string, MaterialSpec>

export function Storage({ product }: { product: StorageProduct }) {
  const materials = useMaterialSet(STORAGE_MATERIALS)

  const length = mm(product.dimensionsMm?.width ?? 80)
  const width = 2.2
  const isPro = product.capacityGb >= 4000

  return (
    <group>
      <mesh position={[0, 0, -length / 2]} material={materials.pcb}>
        <boxGeometry args={[0.18, width, length]} />
      </mesh>

      {[-length * 0.3, -length * 0.55].map((z) => (
        <mesh key={z} position={[-0.16, 0, z]} material={materials.chip}>
          <boxGeometry args={[0.14, width * 0.72, length * 0.18]} />
        </mesh>
      ))}
      <mesh position={[-0.16, 0, -length * 0.13]} material={materials.chip}>
        <boxGeometry args={[0.14, width * 0.6, length * 0.12]} />
      </mesh>

      {isPro ? (
        <mesh position={[-0.34, 0, -length / 2]} material={materials.shield}>
          <boxGeometry args={[0.38, width + 0.3, length]} />
        </mesh>
      ) : null}

      <mesh position={[-0.3, 0, -length * 0.42]} material={materials.label}>
        <boxGeometry args={[0.04, width * 0.55, length * 0.24]} />
      </mesh>
      <Label
        descriptor={{
          text: product.brand,
          sub: `${product.capacityGb / 1000} TB`,
          tone: 'dark',
          width: length * 0.2,
          height: 0.95,
        }}
        position={[-0.33, 0, -length * 0.42]}
        rotation={[0, -Math.PI / 2, 0]}
      />

      <mesh position={[0, 0, -length + 0.15]} material={materials.gold}>
        <boxGeometry args={[0.12, width - 0.4, 0.3]} />
      </mesh>
    </group>
  )
}
