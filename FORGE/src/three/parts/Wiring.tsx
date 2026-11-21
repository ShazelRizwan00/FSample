import { useEffect, useMemo, useRef } from 'react'
import type { JSX } from 'react'
import { useFrame } from '@react-three/fiber'
import { CatmullRomCurve3, TubeGeometry, Vector3, type Group } from 'three'
import { MOUNTS, mm } from '../mounts'
import { explodeState } from '../explode'
import { useMaterialSet, type MaterialSpec } from '../materials'
import type { GpuProduct, MotherboardProduct, PsuProduct } from '@/lib/types'

/**
 * Procedural power harness wiring: ATX 24-pin and PCIe GPU power cable runs.
 *
 * Routing:
 * The ATX 24-pin bundle originates at the motherboard header face (6.5, 31, 16.4)
 * and curves through the chassis interior into the upper motherboard tray grommet
 * at (7.4, 29.5, 18.6).
 * GPU PCIe power runs originate at the card's top edge sockets (derived dynamically
 * from the GPU's height, depth and MOUNTS.gpu.position) and sweep backwards and up
 * into the lower tray grommet at (7.4, 23.5, 19.2).
 *
 * Connector count:
 * The number of GPU runs matches `gpu.powerConnectors` (1 or 2), matching the
 * card's power socket geometry (−2.4 and −4.6 for dual-socket, −2.6 for single-socket)
 * without hard-coded lengths.
 *
 * Strand braiding and explode hiding:
 * Each cable run is assembled from four parallel Catmull-Rom tube strands offset
 * perpendicular to the trajectory and shaded with alternating sleeve/strand
 * materials for a braided custom cable look. All meshes are non-pickable
 * (raycast no-op). The harness is deliberately excluded from the slot registry,
 * and hides instantly as the exploded view engages (explodeState.value < 0.05).
 */

const WIRING_MATERIALS = {
  sleeve: { color: '#2a2f38', roughness: 0.82, metalness: 0.28 },
  strand: { color: '#3f4854', roughness: 0.7, metalness: 0.34 },
  housing: { color: '#12161c', roughness: 0.6, metalness: 0.3 },
} satisfies Record<string, MaterialSpec>

const ATX_STRAND_OFFSETS = [
  { y: -0.22, z: -0.12 },
  { y: -0.22, z: 0.12 },
  { y: 0.22, z: -0.12 },
  { y: 0.22, z: 0.12 },
] as const

const GPU_STRAND_OFFSETS = [
  { x: -0.22, y: -0.12 },
  { x: -0.22, y: 0.12 },
  { x: 0.22, y: -0.12 },
  { x: 0.22, y: 0.12 },
] as const

const ATX_BASE_POINTS = [
  new Vector3(6.5, 31, 16.4),
  new Vector3(6.55, 30.6, 17.0),
  new Vector3(6.9, 30.0, 18.0),
  new Vector3(7.4, 29.5, 18.6),
] as const

type Strand = { geometry: TubeGeometry; materialKey: 'sleeve' | 'strand' }

type GpuCableRun = {
  housingPosition: [number, number, number]
  strands: Strand[]
}

function createStrand(points: Vector3[], index: number): Strand {
  const curve = new CatmullRomCurve3(points, false, 'centripetal')
  return {
    geometry: new TubeGeometry(curve, 48, 0.16, 6, false),
    materialKey: index % 2 === 0 ? 'sleeve' : 'strand',
  }
}

export function Wiring({
  motherboard,
  gpu,
  psu,
}: {
  motherboard: MotherboardProduct | null
  gpu: GpuProduct | null
  psu: PsuProduct | null
}): JSX.Element | null {
  const materials = useMaterialSet(WIRING_MATERIALS)
  const ref = useRef<Group>(null)


  useFrame(() => {
    const group = ref.current
    if (group) group.visible = explodeState.value < 0.05
  })

  const atxRun = useMemo(() => {
    if (!motherboard || !psu) return null
    const strands = ATX_STRAND_OFFSETS.map((offset, index) =>
      createStrand(
        ATX_BASE_POINTS.map((pt) => new Vector3(pt.x, pt.y + offset.y, pt.z + offset.z)),
        index,
      ),
    )
    return {
      // The plug sits over the header's outer face (header box spans x 5.74–7.24),
      // so the shell never coincides with the socket geometry.
      housingPosition: [5.45, 31, 16.4] as [number, number, number],
      strands,
    }
  }, [motherboard, psu])

  useEffect(() => {
    return () => {
      atxRun?.strands.forEach((strand) => strand.geometry.dispose())
    }
  }, [atxRun])

  const gpuRuns = useMemo((): GpuCableRun[] => {
    if (!gpu || !psu) return []
    const width = gpu.dimensionsMm?.height ?? 140
    const thickness = gpu.dimensionsMm?.depth ?? 62
    const connectorZ = gpu.powerConnectors >= 2 ? [-2.4, -4.6] : [-2.6]

    return connectorZ.map((z) => {
      const startX = MOUNTS.gpu.position[0] + mm(width) * 0.16
      const startY = MOUNTS.gpu.position[1] + mm(thickness) + 0.4
      const startZ = MOUNTS.gpu.position[2] + z

      const strands = GPU_STRAND_OFFSETS.map((offset, index) =>
        createStrand(
          [
            new Vector3(startX + offset.x, startY + offset.y, startZ),
            new Vector3(startX + 0.25 + offset.x, 21.2 + offset.y, startZ + 0.4),
            new Vector3(5.2 + offset.x, 22.6 + offset.y, 18.6),
            new Vector3(7.4 + offset.x, 23.5 + offset.y, 19.2),
          ],
          index,
        ),
      )
      // The plug body rides on top of the card's socket instead of inside it.
      return { housingPosition: [startX, startY + 0.5, startZ], strands }
    })
  }, [gpu, psu])

  useEffect(() => {
    return () => {
      gpuRuns.forEach((run) => run.strands.forEach((s) => s.geometry.dispose()))
    }
  }, [gpuRuns])

  if (!psu || (!motherboard && !gpu)) {
    return null
  }

  return (
    <group ref={ref} userData={{ role: 'wiring' }}>
      {atxRun ? (
        <group>
          <mesh position={atxRun.housingPosition} material={materials.housing} raycast={() => undefined}>
            <boxGeometry args={[1, 4.6, 1.15]} />
          </mesh>
          {atxRun.strands.map((strand, index) => (
            <mesh
              key={index}
              geometry={strand.geometry}
              material={materials[strand.materialKey]}
              raycast={() => undefined}
            />
          ))}
        </group>
      ) : null}

      {gpuRuns.map((run, runIndex) => (
        <group key={runIndex}>
          <mesh position={run.housingPosition} material={materials.housing} raycast={() => undefined}>
            <boxGeometry args={[2.5, 1.0, 1.6]} />
          </mesh>
          {run.strands.map((strand, strandIndex) => (
            <mesh
              key={strandIndex}
              geometry={strand.geometry}
              material={materials[strand.materialKey]}
              raycast={() => undefined}
            />
          ))}
        </group>
      ))}
    </group>
  )
}
