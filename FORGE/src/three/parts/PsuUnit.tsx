import { RoundedBox } from '@react-three/drei'
import { mm } from '../mounts'
import { useMaterialSet, type MaterialSpec } from '../materials'
import { Label } from '../decals'
import { Fan } from './Fan'
import type { PsuProduct } from '@/lib/types'

/**
 * Power supply: steel enclosure, downward intake with a wire grille, modular
 * connector bank on the tray side, IEC inlet at the rear and the rated label
 * facing the glass panel.
 */

const PSU_MATERIALS = {
  shell: { color: '#1a1f26', roughness: 0.55, metalness: 0.6 },
  shellEdge: { color: '#252c35', roughness: 0.42, metalness: 0.72 },
  grille: { color: '#0d1116', roughness: 0.6, metalness: 0.7 },
  wire: { color: '#39424e', roughness: 0.4, metalness: 0.85 },
  label: { color: '#e8eef6', roughness: 0.75, metalness: 0.05 },
  connector: { color: '#10151b', roughness: 0.65, metalness: 0.3 },
  socket: { color: '#0f141a', roughness: 0.6, metalness: 0.45 },
  accent: {
    color: '#0b1016',
    emissive: '#8b5cf6',
    emissiveIntensity: 1.2,
    channel: 'rgb',
  },
} satisfies Record<string, MaterialSpec>

export function PsuUnit({ product }: { product: PsuProduct }) {
  const materials = useMaterialSet(PSU_MATERIALS)

  const width = mm(product.dimensionsMm?.width ?? 150)
  const height = mm(product.dimensionsMm?.height ?? 86)
  const depth = mm(product.dimensionsMm?.depth ?? 160)
  const fanSize = Math.min(height - 1.4, 12)

  return (
    <group>
      <RoundedBox
        args={[width, height, depth]}
        radius={0.22}
        smoothness={3}
        material={materials.shell}
        castShadow
        receiveShadow
      />
      <mesh position={[0, height / 2 - 0.12, 0]} material={materials.shellEdge}>
        <boxGeometry args={[width - 0.6, 0.2, depth - 0.6]} />
      </mesh>

      {/* Bottom intake fan behind a wire grille */}
      <group position={[0, -height / 2 + 0.1, depth * 0.06]}>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <Fan
            size={fanSize}
            thickness={0.9}
            spin={1.4}
            rgb={false}
            bladeCount={7}
            label={product.brand}
          />
        </group>
        {Array.from({ length: 5 }).map((_, index) => (
          <mesh
            key={index}
            position={[0, -0.1, -fanSize / 2 + (index * fanSize) / 4]}
            material={materials.wire}
          >
            <boxGeometry args={[fanSize, 0.1, 0.12]} />
          </mesh>
        ))}
      </group>

      {/* Rating label on the glass-facing side */}
      <mesh position={[-width / 2 - 0.03, 0.4, -0.6]} material={materials.label}>
        <boxGeometry args={[0.06, height * 0.6, depth * 0.62]} />
      </mesh>
      <Label
        descriptor={{
          text: product.brand,
          sub: `${product.wattageW} W · ${product.efficiency}`,
          tone: 'dark',
          width: depth * 0.5,
          height: height * 0.32,
        }}
        position={[-width / 2 - 0.07, 0.55, -0.6]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      <mesh position={[-width / 2 - 0.07, -0.7, -0.6]} material={materials.accent}>
        <boxGeometry args={[0.02, 0.22, depth * 0.4]} />
      </mesh>

      {/* Modular connector bank on the tray side */}
      {[-0.25, 0.05, 0.35].map((offset, index) => (
        <mesh
          key={offset}
          position={[width / 2 + 0.12, height * offset, -depth / 4 + index * 2.4]}
          material={materials.connector}
        >
          <boxGeometry args={[0.3, 1.5, 2.1]} />
        </mesh>
      ))}

      {/* Rear inlet, switch and exhaust vents */}
      <mesh position={[0, 0, depth / 2 + 0.05]} material={materials.socket}>
        <boxGeometry args={[width * 0.55, height * 0.72, 0.14]} />
      </mesh>
      <mesh position={[-width * 0.3, 0, depth / 2 + 0.14]} material={materials.socket}>
        <boxGeometry args={[1.6, 1.6, 0.1]} />
      </mesh>
      <mesh position={[width * 0.28, 0, depth / 2 + 0.14]} material={materials.accent}>
        <boxGeometry args={[1.1, 0.5, 0.1]} />
      </mesh>
    </group>
  )
}
