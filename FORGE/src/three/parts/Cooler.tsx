import { useEffect, useMemo } from 'react'
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three'
import { AIO, COOLER, mm } from '../mounts'
import { useMaterialSet, type MaterialSpec } from '../materials'
import { Fan } from './Fan'
import type { CoolingProduct } from '@/lib/types'

/**
 * Cooling hardware. Both designs are built in the socket frame: the cooler grows
 * perpendicular to the motherboard, i.e. toward −X and therefore toward the glass
 * panel — which is exactly how the case's cooler clearance is measured.
 */

const COOLER_MATERIALS = {
  copper: { color: '#b4763f', roughness: 0.3, metalness: 0.95 },
  nickel: { color: '#aab3bf', roughness: 0.26, metalness: 0.95 },
  fin: { color: '#98a3b1', roughness: 0.3, metalness: 0.9 },
  cap: { color: '#232a33', roughness: 0.4, metalness: 0.7 },
  dark: { color: '#161b22', roughness: 0.6, metalness: 0.4 },
  hose: { color: '#12161c', roughness: 0.85, metalness: 0.15 },
  tank: { color: '#222933', roughness: 0.42, metalness: 0.65 },
  rgb: {
    color: '#0b0f14',
    emissive: '#22d3ee',
    emissiveIntensity: 1.6,
    channel: 'rgb',
  },
} satisfies Record<string, MaterialSpec>

export function Cooler({ product }: { product: CoolingProduct }) {
  return product.kind === 'air' ? (
    <AirTower product={product} />
  ) : (
    <LiquidLoop product={product} />
  )
}

function AirTower({ product }: { product: CoolingProduct }) {
  const materials = useMaterialSet(COOLER_MATERIALS)

  const projection = mm(product.heightMm ?? 165)
  const finStart = 2.6
  const finCount = Math.max(10, Math.round((projection - finStart) / 0.72))
  const spacing = (projection - finStart - 0.4) / finCount
  const fanX = -(finStart + projection) / 2

  return (
    <group>
      {/* Cold plate, mount bracket and heatpipe base */}
      <mesh position={[-1.1, 0, 0]} material={materials.copper}>
        <boxGeometry args={[2.2, 5.6, 5.4]} />
      </mesh>
      <mesh position={[-1.35, 0, 0]} material={materials.dark}>
        <boxGeometry args={[0.5, 7.6, 7.4]} />
      </mesh>
      {[-2.7, 2.7].map((y) => (
        <mesh
          key={y}
          position={[-1.35, y, 0]}
          material={materials.nickel}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.16, 0.16, 6.4, 8]} />
        </mesh>
      ))}

      {/* Heatpipes rising into the fin stack */}
      {[
        [-1.2, -1.7],
        [-1.2, 1.7],
        [0, -1.9],
        [0, 1.9],
        [1.2, -1.7],
        [1.2, 1.7],
      ].map(([y, z]) => (
        <mesh
          key={`${y}:${z}`}
          position={[-(projection / 2 + 1.2), y, z]}
          rotation={[0, 0, Math.PI / 2]}
          material={materials.copper}
        >
          <cylinderGeometry args={[0.3, 0.3, projection, 10]} />
        </mesh>
      ))}

      {/* Fin stack: plates perpendicular to the board, airflow front to back */}
      {Array.from({ length: finCount }).map((_, index) => (
        <mesh
          key={index}
          position={[-(finStart + index * spacing), 0, 0]}
          material={materials.fin}
        >
          <boxGeometry args={[0.14, COOLER.finHeight, COOLER.finDepth]} />
        </mesh>
      ))}

      {/* Light panel facing the glass panel */}
      <mesh position={[-(projection + 0.2), 0, 0]} material={materials.cap}>
        <boxGeometry args={[0.4, COOLER.finHeight + 0.4, COOLER.finDepth + 0.4]} />
      </mesh>
      <mesh position={[-(projection + 0.42), 0, 0]} material={materials.rgb}>
        <boxGeometry args={[0.08, 1.1, 3.2]} />
      </mesh>

      {/* 120 mm fan on the front face of the tower */}
      <group position={[fanX, 0, -(COOLER.finDepth / 2 + COOLER.fanThickness / 2)]}>
        <Fan size={COOLER.finHeight} thickness={COOLER.fanThickness} spin={2.1} />
      </group>

      {/* Fan retention clips */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[fanX, side * (COOLER.finHeight / 2 + 0.1), -COOLER.finDepth / 2]}
          material={materials.nickel}
        >
          <boxGeometry args={[0.16, 0.2, 1.2]} />
        </mesh>
      ))}
    </group>
  )
}

function LiquidLoop({ product }: { product: CoolingProduct }) {
  const materials = useMaterialSet(COOLER_MATERIALS)

  const radiatorLength = mm(product.radiatorMm ?? 360)
  const tubeGeometry = useMemo(() => createTubeCurve(-0.9), [])
  const tubeGeometryB = useMemo(() => createTubeCurve(0.9), [])

  useEffect(() => {
    return () => {
      tubeGeometry.dispose()
      tubeGeometryB.dispose()
    }
  }, [tubeGeometry, tubeGeometryB])

  const fanZ = [-13, 0, 13]

  return (
    <group>
      {/* Pump block on the socket, facing the glass */}
      <mesh position={[-1.6, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.dark}>
        <cylinderGeometry args={[3.5, 3.5, 3.2, 32]} />
      </mesh>
      <mesh
        position={[-3.25, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={materials.cap}
      >
        <cylinderGeometry args={[3.3, 3.3, 0.4, 32]} />
      </mesh>
      <mesh position={[-3.5, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.rgb}>
        <torusGeometry args={[2.55, 0.16, 8, 48]} />
      </mesh>
      <mesh
        position={[-3.5, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={materials.nickel}
      >
        <cylinderGeometry args={[1.5, 1.5, 0.12, 28]} />
      </mesh>

      {/* Braided tubing: pump → front → top radiator */}
      <mesh geometry={tubeGeometry} material={materials.hose} castShadow />
      <mesh geometry={tubeGeometryB} material={materials.hose} castShadow />

      {/* Radiator mounted under the top panel */}
      <group position={[AIO.radiatorWidth / 2 - 1.4, AIO.y, AIO.z]}>
        <mesh material={materials.tank}>
          <boxGeometry args={[AIO.radiatorWidth, 0.5, radiatorLength]} />
        </mesh>
        <mesh position={[0, AIO.radiatorThickness / 2, 0]} material={materials.tank}>
          <boxGeometry args={[AIO.radiatorWidth, 0.5, radiatorLength]} />
        </mesh>
        <mesh material={materials.fin}>
          <boxGeometry args={[AIO.radiatorWidth - 1.4, AIO.radiatorThickness, radiatorLength - 1.6]} />
        </mesh>
        {Array.from({ length: 14 }).map((_, index) => (
          <mesh
            key={index}
            position={[0, 0, -(radiatorLength - 3) / 2 + index * ((radiatorLength - 3) / 14)]}
            material={materials.tank}
          >
            <boxGeometry args={[AIO.radiatorWidth - 1.2, AIO.radiatorThickness + 0.2, 0.35]} />
          </mesh>
        ))}
        {/* End tanks */}
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[0, 0, side * (radiatorLength / 2 - 0.6)]}
            material={materials.cap}
          >
            <boxGeometry args={[AIO.radiatorWidth, AIO.radiatorThickness + 1, 1.4]} />
          </mesh>
        ))}
      </group>

      {/* Radiator fans pushing air through the core */}
      {fanZ.map((z, index) => (
        <group
          key={z}
          position={[AIO.radiatorWidth / 2 - 1.4, AIO.y - AIO.radiatorThickness / 2 - 1.3, z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <Fan size={12} thickness={2.5} spin={index % 2 === 0 ? 2.6 : -2.6} />
        </group>
      ))}
    </group>
  )
}

/**
 * Coolant hose: from the pump, forward past the memory, then up the front of the
 * case into the radiator's end tank.
 */
function createTubeCurve(zOffset: number): TubeGeometry {
  const curve = new CatmullRomCurve3([
    new Vector3(-2.4, 0.4, zOffset),
    new Vector3(-2.6, 2.4, -6),
    new Vector3(-2.2, 7.5, -14.4),
    new Vector3(0.6, 20, -17.2),
    new Vector3(1.4, 33, -17.4),
    new Vector3(3.6, 41.4, -17.2),
  ])

  return new TubeGeometry(curve, 64, 0.52, 10, false)
}
