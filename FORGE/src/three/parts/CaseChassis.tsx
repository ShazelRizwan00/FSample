import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { ExtrudeGeometry, Path, Shape, type Group } from 'three'
import { CASE, PSU_BAY, REAR_FAN } from '../mounts'
import { useMaterialSet, type MaterialSpec } from '../materials'

/**
 * Chassis: steel frame, mesh front intake, vented top, motherboard tray with
 * cable grommets, power-supply shroud and a hinged tempered-glass side panel.
 *
 * The rear panel is extruded from a 2D shape with real openings for the I/O
 * cluster, the exhaust fan and the power supply, so the hardware reads through
 * the case instead of sitting behind a solid wall.
 */

const CASE_MATERIALS = {
  steel: { color: '#343c48', roughness: 0.46, metalness: 0.58 },
  steelDark: { color: '#1d232b', roughness: 0.52, metalness: 0.55 },
  interior: { color: '#1b222b', roughness: 0.72, metalness: 0.32 },
  mesh: { color: '#0c1015', roughness: 0.6, metalness: 0.55 },
  trim: { color: '#2d3641', roughness: 0.3, metalness: 0.9 },
  rubber: { color: '#080b0e', roughness: 0.95, metalness: 0.05 },
  glass: {
    color: '#cfe4f2',
    roughness: 0.05,
    metalness: 0.1,
    opacity: 0.09,
    transparent: true,
    channel: 'glass',
  },
  accent: {
    color: '#0b1016',
    emissive: '#22d3ee',
    emissiveIntensity: 1.2,
    channel: 'rgb',
  },
} satisfies Record<string, MaterialSpec>

const HALF_WIDTH = CASE.width / 2
const HALF_DEPTH = CASE.depth / 2

function createRearPanelGeometry(): ExtrudeGeometry {
  const shape = new Shape()
  shape.moveTo(-HALF_WIDTH - 0.35, 0)
  shape.lineTo(HALF_WIDTH + 0.35, 0)
  shape.lineTo(HALF_WIDTH + 0.35, CASE.height)
  shape.lineTo(-HALF_WIDTH - 0.35, CASE.height)
  shape.closePath()

  const rect = (x: number, y: number, width: number, height: number) => {
    const hole = new Path()
    hole.moveTo(x, y)
    hole.lineTo(x + width, y)
    hole.lineTo(x + width, y + height)
    hole.lineTo(x, y + height)
    hole.closePath()
    return hole
  }

  // Rear I/O opening, aligned with the board's shroud.
  shape.holes.push(rect(4.4, 10.4, 3.2, 18.2))
  // Exhaust fan aperture.
  const fanHole = new Path()
  fanHole.absarc(0, REAR_FAN.y, 6.3, 0, Math.PI * 2, true)
  shape.holes.push(fanHole)
  // Power-supply opening.
  shape.holes.push(rect(-PSU_BAY.width / 2 + 0.4, 1, PSU_BAY.width - 0.8, PSU_BAY.height))

  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.35,
    bevelEnabled: false,
    curveSegments: 44,
  })
  geometry.translate(0, 0, HALF_DEPTH + 0.1)

  return geometry
}

export function CaseChassis({ glassOpen = false }: { glassOpen?: boolean }) {
  const materials = useMaterialSet(CASE_MATERIALS)

  const glassRef = useRef<Group>(null)
  const glassMounted = useRef(false)

  // The panel is hinged at the front edge; opening swings it out past the glass side.
  useLayoutEffect(() => {
    const node = glassRef.current
    if (!node) return
    const target = glassOpen ? -1.85 : 0
    if (!glassMounted.current) {
      glassMounted.current = true
      node.rotation.y = target
      return
    }
    gsap.to(node.rotation, { y: target, duration: 0.85, ease: 'power3.inOut' })
  }, [glassOpen])

  const rearGeometry = useMemo(() => createRearPanelGeometry(), [])
  useEffect(() => () => rearGeometry.dispose(), [rearGeometry])

  const frontSlats = Array.from({ length: 26 }, (_, index) => {
    const span = (HALF_WIDTH - 1.1) * 2
    return -HALF_WIDTH + 1.1 + (index * span) / 25
  })

  return (
    <group>
      {/* Right side panel */}
      <mesh position={[HALF_WIDTH + 0.2, CASE.height / 2, 0]} material={materials.steel} castShadow receiveShadow>
        <boxGeometry args={[0.4, CASE.height, CASE.depth]} />
      </mesh>

      {/* Top panel with vent slats */}
      <mesh position={[0, CASE.height - 0.2, 0]} material={materials.steel} castShadow receiveShadow>
        <boxGeometry args={[CASE.width + 0.8, 0.4, CASE.depth]} />
      </mesh>
      {Array.from({ length: 12 }).map((_, index) => (
        <mesh
          key={index}
          position={[-7.6 + index * 1.4, CASE.height - 0.02, 2]}
          material={materials.mesh}
        >
          <boxGeometry args={[0.55, 0.1, 34]} />
        </mesh>
      ))}

      {/* Bottom panel and feet */}
      <mesh position={[0, 0.45, 0]} material={materials.steelDark} receiveShadow>
        <boxGeometry args={[CASE.width + 0.8, 0.4, CASE.depth]} />
      </mesh>
      {[
        [-8, -18],
        [8, -18],
        [-8, 18],
        [8, 18],
      ].map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, 0.2, z]} material={materials.rubber}>
          <cylinderGeometry args={[1.3, 1.3, 0.4, 14]} />
        </mesh>
      ))}

      {/* Rear panel */}
      <mesh geometry={rearGeometry} material={materials.steel} castShadow receiveShadow />

      {/* Rear fan grille */}
      <mesh position={[0, REAR_FAN.y, HALF_DEPTH + 0.55]} material={materials.trim}>
        <torusGeometry args={[6.1, 0.16, 8, 44]} />
      </mesh>
      {Array.from({ length: 7 }).map((_, index) => (
        <mesh
          key={index}
          position={[0, REAR_FAN.y - 5 + index * 1.7, HALF_DEPTH + 0.52]}
          material={materials.trim}
        >
          <boxGeometry args={[11.6, 0.12, 0.1]} />
        </mesh>
      ))}

      {/* PCIe slot covers below the I/O opening */}
      {Array.from({ length: 6 }).map((_, index) => (
        <mesh
          key={index}
          position={[5.4, 8.4 - index * 1.45, HALF_DEPTH + 0.45]}
          material={materials.trim}
        >
          <boxGeometry args={[5.8, 1.5, 0.12]} />
        </mesh>
      ))}

      {/* Front frame + mesh slats */}
      <mesh position={[0, CASE.height - 0.9, -HALF_DEPTH - 0.05]} material={materials.steel}>
        <boxGeometry args={[CASE.width + 0.8, 1.6, 0.5]} />
      </mesh>
      <mesh position={[0, 1.1, -HALF_DEPTH - 0.05]} material={materials.steel}>
        <boxGeometry args={[CASE.width + 0.8, 1.6, 0.5]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (HALF_WIDTH + 0.05), CASE.height / 2, -HALF_DEPTH - 0.05]}
          material={materials.steel}
        >
          <boxGeometry args={[0.6, CASE.height, 0.5]} />
        </mesh>
      ))}
      <mesh position={[0, CASE.height / 2, -HALF_DEPTH + 0.02]}>
        <boxGeometry args={[CASE.width - 2, CASE.height - 3.6, 0.12]} />
        <meshStandardMaterial color="#05080b" transparent opacity={0.4} roughness={0.9} metalness={0.1} />
      </mesh>
      {frontSlats.map((x) => (
        <mesh key={x} position={[x, CASE.height / 2, -HALF_DEPTH - 0.12]} material={materials.mesh}>
          <boxGeometry args={[0.22, CASE.height - 3.4, 0.3]} />
        </mesh>
      ))}
      <mesh position={[0, 4.6, -HALF_DEPTH - 0.18]} material={materials.accent}>
        <boxGeometry args={[CASE.width - 2.4, 0.16, 0.12]} />
      </mesh>

      {/* Front I/O on the top panel */}
      <group position={[0, CASE.height, -16]}>
        <mesh position={[0, 0.05, 0]} material={materials.steelDark}>
          <boxGeometry args={[7, 0.16, 2.2]} />
        </mesh>
        <mesh position={[-2.2, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.accent}>
          <cylinderGeometry args={[0.55, 0.55, 0.24, 20]} />
        </mesh>
        {[0, 1.6].map((offset) => (
          <mesh key={offset} position={[0.6 + offset, 0.18, 0]} material={materials.trim}>
            <boxGeometry args={[0.9, 0.2, 0.7]} />
          </mesh>
        ))}
      </group>

      {/* Motherboard tray with cable grommets */}
      <mesh position={[CASE.trayX + 0.35, 22, 0]} material={materials.interior} receiveShadow>
        <boxGeometry args={[0.35, 40, 42]} />
      </mesh>
      {[-16, -6, 8].map((z) => (
        <mesh key={z} position={[CASE.trayX + 0.16, 16, z]} material={materials.steelDark}>
          <boxGeometry args={[0.2, 7, 4.4]} />
        </mesh>
      ))}

      {/* Power-supply shroud */}
      <mesh position={[-1.1, PSU_BAY.y + PSU_BAY.height + 0.2, 14]} material={materials.interior} castShadow>
        <boxGeometry args={[18.4, 0.35, 17.4]} />
      </mesh>
      <mesh position={[-1.1, 4.8, 5.4]} material={materials.interior}>
        <boxGeometry args={[18.4, 9.2, 0.3]} />
      </mesh>
      <mesh position={[-1.1, PSU_BAY.y + PSU_BAY.height + 0.42, 5.5]} material={materials.accent}>
        <boxGeometry args={[15, 0.12, 0.14]} />
      </mesh>

      {/* Hinged tempered-glass side panel */}
      <group ref={glassRef} position={[CASE.glassX, 1.4, -HALF_DEPTH + 0.5]}>
        <mesh
          position={[0, CASE.height / 2 - 1, CASE.depth / 2 - 1]}
          material={materials.glass}
          raycast={() => undefined}
        >
          <boxGeometry args={[0.14, CASE.height - 3.4, CASE.depth - 3]} />
        </mesh>
        {/* Frame and hinges */}
        <mesh position={[0, 0.9, CASE.depth / 2 - 1]} material={materials.trim}>
          <boxGeometry args={[0.34, 0.5, CASE.depth - 3]} />
        </mesh>
        <mesh position={[0, CASE.height - 2.9, CASE.depth / 2 - 1]} material={materials.trim}>
          <boxGeometry args={[0.34, 0.5, CASE.depth - 3]} />
        </mesh>
        {[3, CASE.depth - 5].map((z) => (
          <mesh key={z} position={[0, CASE.height / 2 - 1, z]} material={materials.trim}>
            <boxGeometry args={[0.34, CASE.height - 3.4, 0.4]} />
          </mesh>
        ))}
        {[4, CASE.depth - 6].map((z) => (
          <mesh key={`hinge-${z}`} position={[0.05, CASE.height / 2 - 1, z]} material={materials.trim}>
            <boxGeometry args={[0.5, 3, 1.2]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
