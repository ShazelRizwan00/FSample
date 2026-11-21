import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { create } from '@react-three/test-renderer'
import type { Object3D } from 'three'
import { DEFAULT_SLOTS } from '@/lib/catalog'
import {
  DEFAULT_APPEARANCE,
  DEFAULT_BUILD_NAME,
  useBuildStore,
} from '@/stores/useBuildStore'
import { explodeState } from './explode'
import { PcRig } from './PcRig'

/**
 * The harness in the assembled rig: it must appear for the fitted hardware, leave
 * with the power supply, and hide while the build is exploded — and it must never
 * become part of the slot registry, which is what keeps it out of hover, selection
 * and camera focus.
 */

let renderer: Awaited<ReturnType<typeof create>> | null = null

beforeEach(() => {
  localStorage.clear()
  explodeState.value = 0
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

afterEach(async () => {
  await renderer?.unmount()
  renderer = null
  explodeState.value = 0
})

function sceneRoot(): Object3D {
  if (!renderer) throw new Error('renderer not created')
  return renderer.scene.instance as unknown as Object3D
}

function wiringGroup(): Object3D | null {
  let found: Object3D | null = null
  sceneRoot().traverse((object) => {
    if (!found && object.userData?.role === 'wiring') found = object
  })
  return found
}

function countMeshes(root: Object3D): number {
  let count = 0
  root.traverse((object) => {
    if ((object as { isMesh?: boolean }).isMesh) count += 1
  })
  return count
}

describe('power harness in the assembled rig', () => {
  it('wires the default build without joining the slot registry', async () => {
    renderer = await create(<PcRig />)

    const harness = wiringGroup()
    expect(harness).not.toBeNull()
    // 24-pin harness (housing + 4 strands) and one GPU run for the single-plug card.
    expect(countMeshes(harness as Object3D)).toBe(10)
    expect((harness as Object3D).userData.category).toBeUndefined()
  })

  it('leaves with the power supply', async () => {
    renderer = await create(<PcRig />)
    expect(wiringGroup()).not.toBeNull()

    useBuildStore.getState().clearSlot('psu')
    await renderer.update(<PcRig />)

    expect(wiringGroup()).toBeNull()
  })

  it('hides while the build is exploded', async () => {
    renderer = await create(<PcRig />)

    explodeState.value = 1
    await renderer.advanceFrames(2, 1 / 60)
    expect((wiringGroup() as Object3D).visible).toBe(false)

    explodeState.value = 0
    await renderer.advanceFrames(2, 1 / 60)
    expect((wiringGroup() as Object3D).visible).toBe(true)
  })
})
