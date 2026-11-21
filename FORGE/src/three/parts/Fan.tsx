import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  ExtrudeGeometry,
  InstancedMesh,
  Matrix4,
  Object3D,
  Path,
  Quaternion,
  Shape,
  Vector3,
} from 'three'
import { useMaterialSet, type MaterialSpec } from '../materials'
import { Label } from '../decals'

/**
 * Shared fan geometry: a beveled frame with a real circular opening, a hub, a
 * ring of pitched instanced blades and an optional addressable-RGB diffuser.
 *
 * Built once per size and reused by the case intake, the cooler, the GPU and the
 * power supply, so every fan in the scene spins from the same code path.
 */

const FAN_MATERIALS = {
  frame: { color: '#14181f', roughness: 0.72, metalness: 0.12 },
  hub: { color: '#1d232c', roughness: 0.42, metalness: 0.45 },
  blade: { color: '#3a4250', roughness: 0.3, metalness: 0.55 },
  screw: { color: '#6c7684', roughness: 0.35, metalness: 0.9 },
  rgb: {
    color: '#0d1117',
    emissive: '#22d3ee',
    emissiveIntensity: 1.4,
    channel: 'rgb',
  },
} satisfies Record<string, MaterialSpec>

/** Blade cross-section: a swept paddle with a curved leading edge. */
function createBladeGeometry(): ExtrudeGeometry {
  const shape = new Shape()
  shape.moveTo(1.5, -0.42)
  shape.quadraticCurveTo(3.1, 0.78, 4.55, 0.52)
  shape.lineTo(4.66, 0.06)
  shape.quadraticCurveTo(3.15, 0.2, 1.44, -0.92)
  shape.closePath()

  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.12,
    bevelEnabled: false,
    curveSegments: 8,
  })

  return geometry
}

const BLADE_GEOMETRY = createBladeGeometry()

function createFrameGeometry(size: number, thickness: number): ExtrudeGeometry {
  const half = size / 2
  const shape = new Shape()
  shape.moveTo(-half, -half)
  shape.lineTo(half, -half)
  shape.lineTo(half, half)
  shape.lineTo(-half, half)
  shape.closePath()

  const opening = new Path()
  opening.absarc(0, 0, half * 0.92, 0, Math.PI * 2, true)
  shape.holes.push(opening)

  const geometry = new ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelSize: 0.07,
    bevelThickness: 0.07,
    bevelSegments: 2,
    curveSegments: 40,
  })
  geometry.translate(0, 0, -thickness / 2)

  return geometry
}

export type FanProps = {
  /** Frame width in scene units (centimetres). */
  size?: number
  thickness?: number
  bladeCount?: number
  /** Radians per second; negative values spin the other way. */
  spin?: number
  rgb?: boolean
  frameColor?: string
  /** Printed hub mark, usually the fan's brand. */
  label?: string
}

export function Fan({
  size = 12,
  thickness = 2.5,
  bladeCount = 9,
  spin = 2.4,
  rgb = true,
  label,
}: FanProps) {
  const materials = useMaterialSet(FAN_MATERIALS)
  const bladesRef = useRef<InstancedMesh>(null)
  const rotorRef = useRef<Object3D>(null)

  const frameGeometry = useMemo(
    () => createFrameGeometry(size, thickness),
    [size, thickness],
  )
  useEffect(() => () => frameGeometry.dispose(), [frameGeometry])

  const bladeScale = size / 12
  const hubRadius = size * 0.19

  useLayoutEffect(() => {
    const mesh = bladesRef.current
    if (!mesh) return

    const matrix = new Matrix4()
    const quaternion = new Quaternion()
    const scale = new Vector3(bladeScale, bladeScale, bladeScale)
    const position = new Vector3()
    const pitch = new Quaternion()
    const step = (Math.PI * 2) / bladeCount

    for (let index = 0; index < bladeCount; index += 1) {
      pitch.setFromAxisAngle(new Vector3(1, 0, 0), 0.42)
      quaternion.setFromAxisAngle(new Vector3(0, 0, 1), index * step)
      quaternion.multiply(pitch)
      matrix.compose(position, quaternion, scale)
      mesh.setMatrixAt(index, matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [bladeCount, bladeScale])

  useFrame((_, delta) => {
    if (!rotorRef.current || spin === 0) return
    rotorRef.current.rotation.z += spin * delta
  })

  const corner = size / 2 - 0.72

  return (
    <group>
      <mesh geometry={frameGeometry} material={materials.frame} castShadow receiveShadow />

      {[
        [-corner, -corner],
        [corner, -corner],
        [corner, corner],
        [-corner, corner],
      ].map(([x, y]) => (
        <mesh
          key={`${x}:${y}`}
          position={[x, y, 0]}
          material={materials.screw}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.34, 0.34, thickness + 0.12, 12]} />
        </mesh>
      ))}

      <group ref={rotorRef}>
        <instancedMesh
          ref={bladesRef}
          args={[BLADE_GEOMETRY, materials.blade, bladeCount]}
        />
        <mesh material={materials.hub} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[hubRadius, hubRadius, thickness * 0.92, 24]} />
        </mesh>
      </group>

      {rgb ? (
        <mesh material={materials.rgb} position={[0, 0, thickness / 2 - 0.02]}>
          <torusGeometry args={[size * 0.44, 0.09, 8, 56]} />
        </mesh>
      ) : null}

      {label ? (
        <Label
          descriptor={{
            text: label,
            width: hubRadius * 1.5,
            height: hubRadius * 0.62,
          }}
          position={[0, 0, thickness / 2 + 0.01]}
        />
      ) : null}
    </group>
  )
}
