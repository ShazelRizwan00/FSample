import {
  BOARD_LAYOUT,
  BOARD_SIZE,
  DIMM_SLOT_Z,
  PCB_THICKNESS,
} from '../mounts'
import { productModelName } from '@/lib/catalog'
import { Label } from '../decals'
import { useMaterialSet, type MaterialSpec } from '../materials'
import type { MotherboardProduct } from '@/lib/types'

/**
 * Motherboard: PCB, AM5 socket frame, four DIMM slots with latches, PCIe slots,
 * VRM and chipset heatsinks, rear I/O cluster with a port stack, M.2 shield,
 * 24-pin header, capacitors and brass standoffs.
 *
 * Local space matches the board frame: origin at the rear-bottom corner of the
 * PCB, −Z toward the front of the case, +Y up, −X toward the glass panel.
 */

const BOARD_MATERIALS = {
  pcb: { color: '#143324', roughness: 0.66, metalness: 0.22 },
  pcbEdge: { color: '#13221a', roughness: 0.5, metalness: 0.3 },
  slot: { color: '#0f1319', roughness: 0.72, metalness: 0.2 },
  slotMetal: { color: '#7d8794', roughness: 0.34, metalness: 0.92 },
  heatsink: { color: '#38414e', roughness: 0.38, metalness: 0.72 },
  heatsinkDark: { color: '#252d38', roughness: 0.45, metalness: 0.6 },
  plastic: { color: '#171d25', roughness: 0.62, metalness: 0.16 },
  gold: { color: '#c9a54c', roughness: 0.28, metalness: 0.95 },
  brass: { color: '#b08d3f', roughness: 0.35, metalness: 0.9 },
  capacitor: { color: '#2b3a4a', roughness: 0.45, metalness: 0.55 },
  port: { color: '#3d4753', roughness: 0.4, metalness: 0.8 },
  accent: {
    color: '#0b1016',
    emissive: '#22d3ee',
    emissiveIntensity: 1.1,
    channel: 'signal',
  },
} satisfies Record<string, MaterialSpec>

export function Motherboard({ product }: { product: MotherboardProduct }) {
  const materials = useMaterialSet(BOARD_MATERIALS)
  const size = BOARD_SIZE[product.formFactor === 'ATX' ? 'ATX' : 'mATX']
  const { length, height } = size

  const pcieSlots = product.pcieSlots >= 3 ? [8, 4.8, 1.6] : [8, 4.8]

  const standoffs: Array<[number, number]> = [
    [1.2, -1.2],
    [1.2, -(length - 1.2)],
    [height - 1.2, -1.2],
    [height - 1.2, -(length - 1.2)],
    [height - 1.2, -(length / 2)],
    [height / 2, -(length - 1.2)],
  ]

  return (
    <group>
      {/* PCB */}
      <mesh position={[-PCB_THICKNESS / 2, height / 2, -length / 2]} material={materials.pcb}>
        <boxGeometry args={[PCB_THICKNESS, height, length]} />
      </mesh>
      {/* Slightly proud board edge, so the PCB silhouette reads at grazing angles. */}
      <mesh
        position={[-PCB_THICKNESS - 0.02, height / 2, -length / 2]}
        material={materials.pcbEdge}
      >
        <boxGeometry args={[0.04, height - 0.5, length - 0.5]} />
      </mesh>

      {/* Standoffs */}
      {standoffs.map(([y, z]) => (
        <mesh
          key={`${y}:${z}`}
          position={[-PCB_THICKNESS - 0.2, y, z]}
          rotation={[0, 0, Math.PI / 2]}
          material={materials.brass}
        >
          <cylinderGeometry args={[0.32, 0.32, 0.4, 10]} />
        </mesh>
      ))}

      {/* CPU socket frame + contact field */}
      <group position={[-PCB_THICKNESS, BOARD_LAYOUT.socket.y, BOARD_LAYOUT.socket.z]}>
        <mesh position={[-0.3, 0, 0]} material={materials.slot}>
          <boxGeometry args={[0.36, 5.7, 5.7]} />
        </mesh>
        {[
          { position: [-0.5, 0, 3.35], size: [0.55, 7.4, 0.7] },
          { position: [-0.5, 0, -3.35], size: [0.55, 7.4, 0.7] },
          { position: [-0.5, 3.35, 0], size: [0.55, 0.7, 5.9] },
          { position: [-0.5, -3.35, 0], size: [0.55, 0.7, 5.9] },
        ].map((bar, index) => (
          <mesh
            key={index}
            position={bar.position as [number, number, number]}
            material={materials.slotMetal}
          >
            <boxGeometry args={bar.size as [number, number, number]} />
          </mesh>
        ))}
        {/* Retention lever */}
        <mesh
          position={[-0.62, -4.35, 0.1]}
          material={materials.slotMetal}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.14, 0.14, 6.5, 8]} />
        </mesh>
      </group>

      {/* DIMM slots with latches */}
      {DIMM_SLOT_Z.map((slotZ, index) => (
        <group key={slotZ} position={[-PCB_THICKNESS, 0, slotZ]}>
          <mesh position={[-0.5, 16.5, 0]} material={materials.slot}>
            <boxGeometry args={[1, 13.3, 0.95]} />
          </mesh>
          <mesh position={[-0.52, 16.5, 0]} material={materials.slotMetal}>
            <boxGeometry args={[0.12, 12.6, 0.36]} />
          </mesh>
          {[16.5 - 6.95, 16.5 + 6.95].map((latchY) => (
            <mesh
              key={latchY}
              position={[-0.62, latchY, 0]}
              rotation={[0, 0, index % 2 === 0 ? 0.12 : -0.12]}
              material={materials.plastic}
            >
              <boxGeometry args={[0.9, 1.25, 1.35]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* PCIe slots: x16 reinforced, then shorter slots */}
      {pcieSlots.map((slotY, index) => (
        <group key={slotY} position={[-PCB_THICKNESS, slotY, BOARD_LAYOUT.pcie.z]}>
          <mesh position={[-0.55, 0, -BOARD_LAYOUT.pcie.length / 2]} material={materials.slot}>
            <boxGeometry args={[1.1, 0.85, BOARD_LAYOUT.pcie.length]} />
          </mesh>
          <mesh position={[-0.6, 0, -BOARD_LAYOUT.pcie.length / 2]} material={materials.slotMetal}>
            <boxGeometry args={[0.16, 0.5, BOARD_LAYOUT.pcie.length - 0.6]} />
          </mesh>
          <mesh position={[-0.62, 0, 0.55]} material={materials.plastic}>
            <boxGeometry args={[1.2, 1.1, 1.2]} />
          </mesh>
          {index === 1 ? (
            <mesh position={[-0.55, 0, -BOARD_LAYOUT.pcie.length - 1.6]} material={materials.slot}>
              <boxGeometry args={[1.05, 0.8, 2.4]} />
            </mesh>
          ) : null}
        </group>
      ))}

      {/* VRM heatsink along the top edge */}
      <group position={[-PCB_THICKNESS, BOARD_LAYOUT.vrm.y, BOARD_LAYOUT.vrm.z]}>
        <mesh position={[-0.85, 0, 0]} material={materials.heatsink}>
          <boxGeometry args={[1.7, 2.2, BOARD_LAYOUT.vrm.width]} />
        </mesh>
        {[-2.4, -0.8, 0.8, 2.4].map((offset) => (
          <mesh key={offset} position={[-1.75, 0, offset]} material={materials.heatsinkDark}>
            <boxGeometry args={[0.12, 2.1, 0.32]} />
          </mesh>
        ))}
      </group>

      {/* VRM heatsink beside the rear I/O */}
      <group position={[-PCB_THICKNESS, BOARD_LAYOUT.vrmRear.y, BOARD_LAYOUT.vrmRear.z]}>
        <mesh position={[-0.9, 0, 0]} material={materials.heatsink}>
          <boxGeometry args={[1.8, BOARD_LAYOUT.vrmRear.height, BOARD_LAYOUT.vrmRear.width]} />
        </mesh>
        {[-2.8, -1.4, 0, 1.4, 2.8].map((offset) => (
          <mesh key={offset} position={[-1.85, offset, 0]} material={materials.heatsinkDark}>
            <boxGeometry args={[0.12, 0.28, BOARD_LAYOUT.vrmRear.width]} />
          </mesh>
        ))}
      </group>

      {/* Chipset heatsink with a lit accent strip */}
      <group position={[-PCB_THICKNESS, BOARD_LAYOUT.chipset.y, BOARD_LAYOUT.chipset.z]}>
        <mesh position={[-0.6, 0, 0]} material={materials.heatsinkDark}>
          <boxGeometry args={[1.2, BOARD_LAYOUT.chipset.size, BOARD_LAYOUT.chipset.size]} />
        </mesh>
        <mesh position={[-1.23, 0, 0]} material={materials.accent}>
          <boxGeometry args={[0.06, 0.35, BOARD_LAYOUT.chipset.size - 1.6]} />
        </mesh>
      </group>

      {/* M.2 socket and shield */}
      <group position={[-PCB_THICKNESS, BOARD_LAYOUT.m2.y, BOARD_LAYOUT.m2.z]}>
        <mesh position={[-0.35, -0.1, 0]} material={materials.slot}>
          <boxGeometry args={[0.7, 0.4, BOARD_LAYOUT.m2.length]} />
        </mesh>
        <mesh position={[-0.22, 0.55, -0.4]} material={materials.heatsink}>
          <boxGeometry args={[0.45, 1.1, BOARD_LAYOUT.m2.length + 1.2]} />
        </mesh>
      </group>

      {/* 24-pin header */}
      <group position={[-PCB_THICKNESS, BOARD_LAYOUT.atx24.y, BOARD_LAYOUT.atx24.z]}>
        <mesh position={[-0.75, 0, 0]} material={materials.plastic}>
          <boxGeometry args={[1.5, 5.4, 1.3]} />
        </mesh>
        <mesh position={[-1.52, 0, 0]} material={materials.slotMetal}>
          <boxGeometry args={[0.06, 4.6, 0.9]} />
        </mesh>
      </group>

      {/* Rear I/O cluster: shroud, port stack and heat fins */}
      <group position={[-PCB_THICKNESS, BOARD_LAYOUT.ioShroud.y, BOARD_LAYOUT.ioShroud.z]}>
        <mesh position={[-1.35, 0, -1.3]} material={materials.heatsink}>
          <boxGeometry args={[2.7, BOARD_LAYOUT.ioShroud.height, 2.6]} />
        </mesh>
        <mesh position={[-1.4, 6.4, 0.06]} material={materials.plastic}>
          <boxGeometry args={[2.4, 4.2, 0.12]} />
        </mesh>
        {[
          [-0.85, 7.7],
          [0.05, 7.7],
          [0.95, 7.7],
          [-0.85, 5.6],
          [0.05, 5.6],
          [0.95, 5.6],
        ].map(([x, y], index) => (
          <mesh key={index} position={[x - 1.4, y - 1, 0.16]} material={materials.port}>
            <boxGeometry args={[0.8, 0.95, 0.3]} />
          </mesh>
        ))}
        {[-1.2, -0.5].map((x) => (
          <mesh
            key={x}
            position={[x - 0.2, -4.4, 0.18]}
            rotation={[Math.PI / 2, 0, 0]}
            material={materials.port}
          >
            <cylinderGeometry args={[0.32, 0.32, 0.34, 12]} />
          </mesh>
        ))}
        <mesh position={[-0.6, 2.6, 0.16]} material={materials.gold}>
          <boxGeometry args={[1.6, 0.5, 0.3]} />
        </mesh>
      </group>

      {/* Capacitor bank beside the socket */}
      {[
        [21.4, -13.4],
        [21.4, -14.9],
        [19.2, -14.9],
        [14.4, -2.2],
        [12.8, -2.2],
      ].map(([y, z]) => (
        <mesh
          key={`${y}:${z}`}
          position={[-PCB_THICKNESS - 0.45, y, z]}
          rotation={[0, 0, Math.PI / 2]}
          material={materials.capacitor}
        >
          <cylinderGeometry args={[0.28, 0.28, 0.9, 10]} />
        </mesh>
      ))}

      {/* Silkscreen board branding on the exposed front third */}
      <Label
        descriptor={{
          text: product.brand,
          sub: productModelName(product),
          width: 7,
          height: 1.7,
        }}
        position={[-PCB_THICKNESS - 0.03, 14, -24]}
        rotation={[0, -Math.PI / 2, 0]}
      />

      {/* Chipset heatsink marking */}
      <Label
        descriptor={{ text: product.brand, width: 2.4, height: 0.72 }}
        position={[-PCB_THICKNESS - 1.23, BOARD_LAYOUT.chipset.y, BOARD_LAYOUT.chipset.z]}
        rotation={[0, -Math.PI / 2, 0]}
      />

      {/* Silkscreen registration marks */}
      <mesh position={[-PCB_THICKNESS - 0.03, height - 0.9, -2.2]} material={materials.gold}>
        <boxGeometry args={[0.02, 0.3, 1.1]} />
      </mesh>
    </group>
  )
}

