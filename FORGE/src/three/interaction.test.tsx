import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { create } from '@react-three/test-renderer'
import { BoxGeometry, Mesh, PerspectiveCamera, Vector3, type Object3D } from 'three'
import { DEFAULT_SLOTS } from '@/lib/catalog'
import type { CategoryId } from '@/lib/types'
import {
  DEFAULT_APPEARANCE,
  DEFAULT_BUILD_NAME,
  useBuildStore,
} from '@/stores/useBuildStore'
import { computeFocusFrame } from './cameraFocus'
import { findPartCategory } from './interaction'
import { getPartObject } from './partRegistry'
import { PcRig } from './PcRig'

/**
 * Interaction wiring: pointer events resolve to a slot and reach the store, and
 * camera framing keeps the user's angle while fitting the component.
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
    lastSavedAt: null,
    cameraResetToken: 0,
    focusRequest: null,
  })
})

let renderer: Awaited<ReturnType<typeof create>> | null = null

afterEach(async () => {
  await renderer?.unmount()
  renderer = null
})

/** The rig root is the only instance carrying the pointer handlers. */
function rigRoot() {
  if (!renderer) throw new Error('renderer not created')
  const root = renderer.scene.findAll(
    (node) => typeof node.props?.onClick === 'function',
  )[0]
  if (!root) throw new Error('no rig root found')
  return root
}

function firstMeshOf(category: CategoryId): Object3D {
  const part = getPartObject(category)
  if (!part) throw new Error(`part "${category}" is not registered`)
  let mesh: Object3D | null = null
  part.traverse((object) => {
    if (!mesh && (object as Mesh).isMesh) mesh = object
  })
  if (!mesh) throw new Error(`part "${category}" has no mesh`)
  return mesh
}

describe('rig interaction', () => {
  it('registers every equipped slot with the scene registry', async () => {
    renderer = await create(<PcRig />)

    for (const category of Object.keys(DEFAULT_SLOTS) as CategoryId[]) {
      expect(getPartObject(category)).toBeTruthy()
    }
  })

  it('selects the clicked component', async () => {
    renderer = await create(<PcRig />)

    await renderer.fireEvent(rigRoot(), 'onClick', { object: firstMeshOf('gpu') })

    expect(useBuildStore.getState().selectedCategory).toBe('gpu')
  })

  it('resolves a nested mesh to its owning slot', async () => {
    renderer = await create(<PcRig />)

    await renderer.fireEvent(rigRoot(), 'onClick', {
      object: firstMeshOf('ram'),
    })

    expect(useBuildStore.getState().selectedCategory).toBe('ram')
    expect(findPartCategory(firstMeshOf('cpu'))).toBe('cpu')
  })

  it('highlights on hover and clears when the pointer leaves', async () => {
    renderer = await create(<PcRig />)

    await renderer.fireEvent(rigRoot(), 'onPointerMove', {
      object: firstMeshOf('cooling'),
    })
    expect(useBuildStore.getState().hoveredCategory).toBe('cooling')

    await renderer.fireEvent(rigRoot(), 'onPointerOut', {})
    expect(useBuildStore.getState().hoveredCategory).toBeNull()
  })

  it('requests a camera focus on double-click, keeping the selection intact', async () => {
    renderer = await create(<PcRig />)

    await renderer.fireEvent(rigRoot(), 'onClick', { object: firstMeshOf('gpu') })
    await renderer.fireEvent(rigRoot(), 'onDoubleClick', {
      object: firstMeshOf('gpu'),
    })

    const state = useBuildStore.getState()
    expect(state.selectedCategory).toBe('gpu')
    expect(state.focusRequest?.category).toBe('gpu')
    expect(state.focusRequest?.token).toBe(1)
  })

  it('clears the selection when nothing is hit', async () => {
    renderer = await create(<PcRig />)
    useBuildStore.getState().selectCategory('psu')

    await renderer.fireEvent(rigRoot(), 'onClick', { object: null })

    expect(useBuildStore.getState().selectedCategory).toBeNull()
  })
})

describe('camera framing', () => {
  function boxObject(size: [number, number, number], at: [number, number, number]) {
    const mesh = new Mesh(new BoxGeometry(...size))
    mesh.position.set(...at)
    mesh.updateMatrixWorld(true)
    return mesh
  }

  it('frames the target at the object centre and keeps the current angle', () => {
    const camera = new PerspectiveCamera(35, 1.4, 0.5, 400)
    camera.position.set(40, 30, 40)
    const currentTarget = new Vector3(0, 0, 0)
    const object = boxObject([20, 20, 20], [0, 10, 0])

    const frame = computeFocusFrame(camera, currentTarget, object)
    expect(frame).not.toBeNull()
    if (!frame) return

    expect(frame.target.y).toBeCloseTo(10, 3)

    const before = camera.position.clone().sub(currentTarget).normalize()
    const after = frame.position.clone().sub(frame.target).normalize()
    expect(after.dot(before)).toBeCloseTo(1, 3)

    // The fit distance must clear the object's radius at the camera's fov.
    const distance = frame.position.distanceTo(frame.target)
    expect(distance).toBeGreaterThan(20 / 2 / Math.tan((35 * Math.PI) / 360))
  })

  it('pulls back further for larger components', () => {
    const camera = new PerspectiveCamera(35, 1.4, 0.5, 400)
    camera.position.set(60, 40, 60)
    const target = new Vector3(0, 0, 0)

    const small = computeFocusFrame(camera, target, boxObject([6, 6, 6], [0, 0, 0]))
    const large = computeFocusFrame(camera, target, boxObject([34, 14, 6], [0, 0, 0]))
    if (!small || !large) throw new Error('frames missing')

    expect(large.position.distanceTo(large.target)).toBeGreaterThan(
      small.position.distanceTo(small.target),
    )
  })

  it('returns null for an object without geometry', () => {
    const camera = new PerspectiveCamera(35, 1.4, 0.5, 400)
    const empty = new Mesh()

    expect(computeFocusFrame(camera, new Vector3(), empty)).toBeNull()
  })
})
