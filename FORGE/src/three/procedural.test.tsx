import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { create } from '@react-three/test-renderer'
import { Box3, type Object3D } from 'three'
import { DEFAULT_SLOTS } from '@/lib/catalog'
import type { CategoryId } from '@/lib/types'
import {
  DEFAULT_APPEARANCE,
  DEFAULT_BUILD_NAME,
  useBuildStore,
} from '@/stores/useBuildStore'
import { PcRig } from './PcRig'

/**
 * Headless render of the procedural hardware, asserting that the geometry — not
 * just the state — follows the configured products: a 336 mm card really is
 * 33.6 units long, a 4-module kit really has four sticks, and the glass panel
 * really swings away from the chassis when opened.
 *
 * Slot anchors now animate: an incoming part slides in while the outgoing one
 * plays its exit. Measurements therefore target the settled "installed" subtree.
 */

beforeEach(() => {
  localStorage.clear()
  useBuildStore.setState({
    buildName: DEFAULT_BUILD_NAME,
    slots: { ...DEFAULT_SLOTS },
    selectedCategory: null,
    hoveredCategory: null,
    panelOpen: false,
    exploded: false,
    appearance: { ...DEFAULT_APPEARANCE },
    leftRailOpen: true,
    rightRailOpen: true,
    lastSavedAt: null,
    cameraResetToken: 0,
    focusRequest: null,
    revealRequest: null,
  })
})

let renderer: Awaited<ReturnType<typeof create>> | null = null

afterEach(async () => {
  await renderer?.unmount()
  renderer = null
})

async function waitFor(predicate: () => boolean, timeoutMs = 3000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (predicate()) return
    await new Promise((resolve) => setTimeout(resolve, 40))
  }
  throw new Error('timed out waiting for the scene to settle')
}

function sceneRoot(): Object3D {
  if (!renderer) throw new Error('renderer not created')
  return renderer.scene.instance as unknown as Object3D
}

function slotGroup(root: Object3D, category: CategoryId): Object3D {
  let found: Object3D | null = null
  root.traverse((object) => {
    if (!found && object.userData?.category === category) found = object
  })
  if (!found) throw new Error(`no slot anchor for "${category}"`)
  return found
}

/** The subtree holding the component that is currently installed. */
function installedContent(root: Object3D, category: CategoryId): Object3D {
  const anchor = slotGroup(root, category)
  return (
    anchor.children.find((child) => child.userData?.role === 'installed') ?? anchor
  )
}

function countMeshesIn(root: Object3D): number {
  let count = 0
  root.traverse((object) => {
    if ((object as { isMesh?: boolean }).isMesh) count += 1
  })
  return count
}

function measure(root: Object3D, category: CategoryId): Box3 {
  root.updateMatrixWorld(true)
  return new Box3().setFromObject(installedContent(root, category))
}

async function settle(category: CategoryId) {
  await waitFor(() => {
    const content = installedContent(sceneRoot(), category)
    return (
      Math.abs(content.scale.x - 1) < 0.005 && content.position.lengthSq() < 1e-4
    )
  })
  sceneRoot().updateMatrixWorld(true)
}

describe('procedural hardware kit', () => {
  it('renders every populated slot of the default build', async () => {
    renderer = await create(<PcRig />)

    for (const category of Object.keys(DEFAULT_SLOTS) as CategoryId[]) {
      const content = installedContent(sceneRoot(), category)
      expect(countMeshesIn(content)).toBeGreaterThan(0)
    }
  })

  it('sizes the graphics card to the product it represents', async () => {
    renderer = await create(<PcRig />)

    const triple = measure(sceneRoot(), 'gpu')
    expect(triple.max.z - triple.min.z).toBeGreaterThan(33)
    expect(triple.max.z - triple.min.z).toBeLessThan(35)

    useBuildStore.getState().equip('gpu', 'gpu-titan-4070-mini')
    await renderer.update(<PcRig />)
    await settle('gpu')

    const dual = measure(sceneRoot(), 'gpu')
    expect(dual.max.z - dual.min.z).toBeGreaterThan(23.5)
    expect(dual.max.z - dual.min.z).toBeLessThan(26)

    // The card also has to be narrower than the triple-fan flagship.
    expect(dual.max.x - dual.min.x).toBeLessThan(triple.max.x - triple.min.x)
  })

  it('builds one DIMM per populated module', async () => {
    renderer = await create(<PcRig />)

    const dualSticks = countMeshesIn(installedContent(sceneRoot(), 'ram'))
    expect(dualSticks).toBeGreaterThan(0)

    useBuildStore.getState().equip('ram', 'ram-vortex-ddr5-32-quad')
    await renderer.update(<PcRig />)
    await settle('ram')

    expect(countMeshesIn(installedContent(sceneRoot(), 'ram'))).toBe(dualSticks * 2)
  })

  it('swaps the cooling design between an air tower and a liquid loop', async () => {
    renderer = await create(<PcRig />)

    const air = countMeshesIn(installedContent(sceneRoot(), 'cooling'))
    useBuildStore.getState().equip('cooling', 'cool-loop-360')
    await renderer.update(<PcRig />)
    await settle('cooling')

    const liquid = countMeshesIn(installedContent(sceneRoot(), 'cooling'))
    expect(liquid).toBeGreaterThan(air)

    // The radiator is wider than the air tower is tall.
    const radiator = measure(sceneRoot(), 'cooling')
    expect(radiator.max.z - radiator.min.z).toBeGreaterThan(35)
  })

  it('swings the glass panel away from the chassis', async () => {
    renderer = await create(<PcRig />)

    const closed = measure(sceneRoot(), 'case')
    useBuildStore.getState().setPanelOpen(true)
    await renderer.update(<PcRig />)

    // The hinge tweens open; wait for the swing before measuring.
    await waitFor(() => measure(sceneRoot(), 'case').min.x < closed.min.x - 20)
    const open = measure(sceneRoot(), 'case')

    expect(closed.min.x).toBeGreaterThan(-12)
    expect(open.min.x).toBeLessThan(closed.min.x - 20)
  })

  it('animates a removed component out before releasing its geometry', async () => {
    renderer = await create(<PcRig />)
    expect(countMeshesIn(slotGroup(sceneRoot(), 'gpu'))).toBeGreaterThan(0)

    useBuildStore.getState().clearSlot('gpu')
    await renderer.update(<PcRig />)

    await waitFor(() => countMeshesIn(slotGroup(sceneRoot(), 'gpu')) === 0)
    expect(countMeshesIn(installedContent(sceneRoot(), 'gpu'))).toBe(0)
  })
})
