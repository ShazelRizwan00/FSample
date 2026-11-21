import { RoundedBox } from '@react-three/drei'
import { mm } from '../mounts'
import { useMaterialSet, type MaterialSpec } from '../materials'
import { Fan } from './Fan'
import type { GpuProduct } from '@/lib/types'

/**
 * Graphics card, modelled the way it actually sits in a tower: the fans face the
 * power-supply shroud and the backplate faces up, so from the glass panel you see
 * the machined top surface, the power connectors and the card's edge.
 *
 * Local space: origin at the bracket-side bottom of the card. The card runs along
 * −Z for its length, spans ±X for its width and rises in +Y for its thickness.
 */

const GPU_MATERIALS = {
  shroud: { color: '#262f3a', roughness: 0.42, metalness: 0.55 },
  shroudTrim: { color: '#2a323d', roughness: 0.3, metalness: 0.7 },
  backplate: { color: '#313b47', roughness: 0.36, metalness: 0.78 },
  backplateInset: { color: '#171c23', roughness: 0.5, metalness: 0.6 },
  fin: { color: '#8f9aa8', roughness: 0.28, metalness: 0.95 },
  copperFin: { color: '#b4763f', roughness: 0.3, metalness: 0.95 },
  pcb: { color: '#0c1118', roughness: 0.6, metalness: 0.25 },
  bracket: { color: '#c2c9d3', roughness: 0.3, metalness: 0.95 },
  gold: { color: '#c9a54c', roughness: 0.28, metalness: 0.95 },
  screw: { color: '#6f7885', roughness: 0.35, metalness: 0.9 },
  rgb: {
    color: '#0c1118',
    emissive: '#8b5cf6',
    emissiveIntensity: 1.5,
    channel: 'rgb',
  },
} satisfies Record<string, MaterialSpec>

export function GpuCard({ product }: { product: GpuProduct }) {
  const materials = useMaterialSet(GPU_MATERIALS)

  const length = mm(product.lengthMm)
  const width = mm(product.dimensionsMm?.height ?? 140)
  const thickness = mm(product.dimensionsMm?.depth ?? 62)
  const fanCount = product.fanCount
  const isFlagship = product.lengthMm >= 350

  const perFan = (length - 2) / fanCount
  const fanSize = Math.min(width - 2.2, perFan - 0.9)
  const fanZ = Array.from(
    { length: fanCount },
    (_, index) => -(1 + perFan * (index + 0.5)),
  )

  const finMaterial = isFlagship ? materials.copperFin : materials.fin
  const shroudThickness = Math.max(1.5, thickness - 2.6)

  return (
    <group>
      {/* PCB */}
      <mesh
        position={[0, thickness - 0.9, -length / 2]}
        material={materials.pcb}
      >
        <boxGeometry args={[width - 1.4, 0.16, length - 1]} />
      </mesh>

      {/* PCIe edge connector reaching into the board's slot */}
      <mesh
        position={[width / 2 - 0.75, thickness - 0.35, -4.6]}
        material={materials.gold}
      >
        <boxGeometry args={[1.5, 0.7, 8.6]} />
      </mesh>

      {/* Heatsink block behind the fans */}
      <mesh
        position={[0, thickness / 2 + 0.15, -length / 2]}
        material={finMaterial}
      >
        <boxGeometry args={[width - 1.8, shroudThickness, length - 1.6]} />
      </mesh>
      {Array.from({ length: Math.round(length / 2) }).map((_, index) => (
        <mesh
          key={index}
          position={[
            0,
            thickness / 2 + 0.15,
            -1.2 - (index * (length - 2)) / Math.round(length / 2),
          ]}
          material={materials.fin}
        >
          <boxGeometry args={[width - 1.4, shroudThickness + 0.1, 0.22]} />
        </mesh>
      ))}

      {/* Shroud sides and end caps */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (width / 2 - 0.28), thickness / 2, -length / 2]}
          material={materials.shroud}
        >
          <boxGeometry args={[0.56, thickness, length]} />
        </mesh>
      ))}
      <mesh
        position={[0, thickness / 2, -length + 0.35]}
        material={materials.shroud}
      >
        <boxGeometry args={[width, thickness, 0.7]} />
      </mesh>
      <mesh position={[0, thickness / 2, -0.2]} material={materials.shroud}>
        <boxGeometry args={[width, thickness, 0.5]} />
      </mesh>

      {/* Machined backplate with vents and a branding inset */}
      <RoundedBox
        args={[width, 0.36, length]}
        radius={0.12}
        smoothness={2}
        position={[0, thickness - 0.1, -length / 2]}
        material={materials.backplate}
        castShadow
      />
      <mesh
        position={[width * 0.18, thickness + 0.1, -length * 0.5]}
        material={materials.backplateInset}
      >
        <boxGeometry args={[width * 0.42, 0.06, length * 0.46]} />
      </mesh>
      {Array.from({ length: 4 }).map((_, index) => (
        <mesh
          key={index}
          position={[
            -width * 0.3,
            thickness + 0.11,
            -length * 0.32 - index * 1.5,
          ]}
          rotation={[0, 0.35, 0]}
          material={materials.backplateInset}
        >
          <boxGeometry args={[width * 0.2, 0.05, 0.5]} />
        </mesh>
      ))}
      <mesh
        position={[width * 0.18, thickness + 0.13, -length * 0.24]}
        material={materials.rgb}
      >
        <boxGeometry args={[width * 0.18, 0.05, 0.14]} />
      </mesh>

      {/* Power connectors on the top edge */}
      {(isFlagship ? [-2.4, -4.6] : [-2.6]).map((z) => (
        <mesh
          key={z}
          position={[width * 0.16, thickness + 0.4, z]}
          material={materials.shroudTrim}
        >
          <boxGeometry args={[2.4, 0.85, 1.5]} />
        </mesh>
      ))}

      {/* Rear bracket with screw flange */}
      <mesh position={[0, thickness / 2, 0.05]} material={materials.bracket}>
        <boxGeometry args={[width * 0.94, thickness * 0.92, 0.14]} />
      </mesh>
      <mesh
        position={[width / 2 - 0.55, thickness * 0.78, 0.16]}
        material={materials.bracket}
      >
        <boxGeometry args={[1.1, 1.3, 0.14]} />
      </mesh>
      <mesh
        position={[width / 2 - 0.55, thickness * 0.78, 0.24]}
        rotation={[Math.PI / 2, 0, 0]}
        material={materials.screw}
      >
        <cylinderGeometry args={[0.22, 0.22, 0.2, 10]} />
      </mesh>

      {/* Fan stack on the underside */}
      {fanZ.map((z, index) => (
        <group
          key={z}
          position={[0, 0.95, z]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <Fan
            size={fanSize}
            thickness={1.9}
            spin={index % 2 === 0 ? 2.9 : -2.9}
            rgb={isFlagship}
            bladeCount={9}
          />
        </group>
      ))}
    </group>
  )
}
