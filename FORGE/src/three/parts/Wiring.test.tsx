import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { create } from '@react-three/test-renderer'
import { Mesh, Raycaster, Vector3, type Intersection } from 'three'
import { PRODUCTS_BY_ID } from '@/lib/catalog'
import type { GpuProduct, MotherboardProduct, PsuProduct } from '@/lib/types'
import { explodeState } from '../explode'
import { Wiring } from './Wiring'

/**
 * Cable runs: the harness must exist for the parts that are fitted, add a run per
 * GPU power connector, never intercept pointer hits, and vanish as soon as the
 * exploded view starts.
 */

const board = PRODUCTS_BY_ID['mb-nova-x670e'] as MotherboardProduct
const psu = PRODUCTS_BY_ID['psu-volt-750g'] as PsuProduct
const singleConnectorGpu = PRODUCTS_BY_ID['gpu-titan-4080-phantom'] as GpuProduct
const dualConnectorGpu = PRODUCTS_BY_ID['gpu-titan-4090-colossus'] as GpuProduct

/** Two housings plus four strands per run. */
const ATX_MESHES = 5
const GPU_RUN_MESHES = 5

beforeEach(() => {
  explodeState.value = 0
})

afterEach(() => {
  explodeState.value = 0
})

function meshes(renderer: Awaited<ReturnType<typeof create>>): Mesh[] {
  return renderer.scene.findAllByType('Mesh').map((node) => node.instance as Mesh)
}

describe('Wiring', () => {
  it('builds the 24-pin and GPU harnesses and hides them when exploded', async () => {
    const renderer = await create(
      <Wiring motherboard={board} gpu={singleConnectorGpu} psu={psu} />,
    )

    expect(meshes(renderer)).toHaveLength(ATX_MESHES + GPU_RUN_MESHES)

    const root = renderer.scene.instance.children[0] as Mesh['parent']
    expect(root?.visible).toBe(true)

    explodeState.value = 1
    await renderer.advanceFrames(2, 1 / 60)
    expect(root?.visible).toBe(false)

    await renderer.unmount()
  })

  it('cannot be hit by a ray, so hardware stays clickable', async () => {
    const renderer = await create(
      <Wiring motherboard={board} gpu={singleConnectorGpu} psu={psu} />,
    )

    const harness = meshes(renderer)
    const tube = harness.find(
      (mesh) => (mesh.geometry as { type?: string }).type === 'TubeGeometry',
    )
    expect(tube).toBeTruthy()
    if (!tube) return

    tube.geometry.computeBoundingSphere()
    const centre = tube.geometry.boundingSphere?.center.clone() ?? new Vector3()
    // Aim straight through the middle of a strand, so the ray genuinely crosses it.
    const ray = new Raycaster(centre.clone().add(new Vector3(10, 0, 0)), new Vector3(-1, 0, 0))

    // Control: the same geometry without the override must register the hit,
    // otherwise the zero-hit assertion below could pass just by missing.
    const controlHits: Intersection[] = []
    new Mesh(tube.geometry).raycast(ray, controlHits)
    expect(controlHits.length).toBeGreaterThan(0)

    const harnessHits: Intersection[] = []
    for (const mesh of harness) mesh.raycast(ray, harnessHits)
    expect(harnessHits).toHaveLength(0)

    await renderer.unmount()
  })

  it('adds a second GPU run for a dual-connector card', async () => {
    const renderer = await create(
      <Wiring motherboard={board} gpu={dualConnectorGpu} psu={psu} />,
    )

    expect(meshes(renderer)).toHaveLength(ATX_MESHES + GPU_RUN_MESHES * 2)
    await renderer.unmount()
  })

  it('omits the GPU run when the card is missing', async () => {
    const renderer = await create(
      <Wiring motherboard={board} gpu={null} psu={psu} />,
    )

    expect(meshes(renderer)).toHaveLength(ATX_MESHES)
    await renderer.unmount()
  })

  it('renders nothing without a power supply', async () => {
    const renderer = await create(
      <Wiring motherboard={board} gpu={singleConnectorGpu} psu={null} />,
    )

    expect(meshes(renderer)).toHaveLength(0)
    await renderer.unmount()
  })
})
