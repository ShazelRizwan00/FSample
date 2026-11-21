import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { create } from '@react-three/test-renderer'
import {
  CanvasTexture,
  Mesh,
  MeshStandardMaterial,
  Raycaster,
  SRGBColorSpace,
  Vector3,
  type Intersection,
} from 'three'
import {
  Label,
  clearLabelCache,
  createLabelTexture,
  getLabelTexture,
} from './decals'

/**
 * Decal pipeline: canvas textures must be sized from the descriptor, drawn with
 * the right ink, cached by content (one texture per unique label, not per part),
 * and mounted as non-pickable planes. Where no 2D canvas exists — jsdom, SSR —
 * the pipeline must degrade to "no label" rather than throwing.
 */

type DrawRecord = {
  texts: Array<{ text: string; colour: string }>
  rects: Array<{ colour: string; width: number; height: number }>
}

let draws: DrawRecord[] = []

function fakeContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const record: DrawRecord = { texts: [], rects: [] }
  draws.push(record)

  const ctx = {
    canvas,
    font: '',
    textBaseline: 'alphabetic',
    fillStyle: '',
    clearRect: () => undefined,
    fillText(text: string) {
      record.texts.push({ text, colour: String(ctx.fillStyle) })
    },
    fillRect(_x: number, _y: number, width: number, height: number) {
      record.rects.push({ colour: String(ctx.fillStyle), width, height })
    },
  }

  // Deliberately no `letterSpacing`: the pipeline must feature-detect it.
  return ctx as unknown as CanvasRenderingContext2D
}

let contextSpy: ReturnType<typeof vi.spyOn> | null = null

function installFakeCanvas() {
  contextSpy = vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockImplementation(function (this: HTMLCanvasElement) {
      return fakeContext(this)
    } as unknown as HTMLCanvasElement['getContext'])
}

beforeEach(() => {
  draws = []
  clearLabelCache()
  installFakeCanvas()
})

afterEach(() => {
  contextSpy?.mockRestore()
  contextSpy = null
  clearLabelCache()
})

function lastDraw(): DrawRecord {
  const record = draws[draws.length - 1]
  if (!record) throw new Error('nothing was drawn')
  return record
}

describe('createLabelTexture', () => {
  it('sizes the bitmap from the descriptor aspect ratio and tags it sRGB', () => {
    const texture = createLabelTexture({ text: 'VOLT 750G', width: 10, height: 2.5 })

    expect(texture).toBeInstanceOf(CanvasTexture)
    const image = texture?.image as HTMLCanvasElement
    expect(image.width).toBe(512)
    expect(image.height).toBe(128)
    expect(texture?.colorSpace).toBe(SRGBColorSpace)
    expect(texture?.anisotropy).toBe(4)
    // needsUpdate is a write-only setter in three; it raises the upload version.
    expect(texture?.version).toBeGreaterThan(0)
  })

  it('draws the title, the sub-line and the accent rule', () => {
    createLabelTexture({
      text: 'VOLT 750G',
      sub: '80+ GOLD · 750 W',
      accent: '#22d3ee',
      width: 10,
      height: 3,
    })

    const record = lastDraw()
    expect(record.texts.map((entry) => entry.text)).toEqual([
      'VOLT 750G',
      '80+ GOLD · 750 W',
    ])
    expect(record.texts[0].colour).toBe('#eef4fb')
    expect(record.rects).toHaveLength(1)
    expect(record.rects[0]).toMatchObject({ colour: '#22d3ee', height: 6 })
  })

  it('switches to dark ink for dark-tone labels', () => {
    createLabelTexture({ text: 'FORGE', tone: 'dark', width: 4, height: 1 })

    expect(lastDraw().texts[0].colour).toBe('#0b0f14')
  })

  it('returns null instead of throwing when no 2D context exists', () => {
    contextSpy?.mockImplementation(() => null)

    expect(createLabelTexture({ text: 'X', width: 4, height: 1 })).toBeNull()
  })
})

describe('label cache', () => {
  it('shares one texture between identical descriptors', () => {
    const descriptor = { text: 'TITAN', sub: 'RTX-4080', width: 6, height: 1.4 }

    const first = getLabelTexture(descriptor)
    const second = getLabelTexture({ ...descriptor })

    expect(first).toBeInstanceOf(CanvasTexture)
    expect(second).toBe(first)
    // Drawn once: the second lookup came from the cache.
    expect(draws).toHaveLength(1)

    const other = getLabelTexture({ ...descriptor, sub: 'RTX-4090' })
    expect(other).not.toBe(first)
    expect(draws).toHaveLength(2)
  })

  it('disposes and rebuilds after the cache is cleared', () => {
    const first = getLabelTexture({ text: 'NOVA X670E', width: 6, height: 1.1 })
    expect(first).toBeInstanceOf(CanvasTexture)

    const dispose = vi.spyOn(first as CanvasTexture, 'dispose')
    clearLabelCache()

    expect(dispose).toHaveBeenCalledTimes(1)
    const rebuilt = getLabelTexture({ text: 'NOVA X670E', width: 6, height: 1.1 })
    expect(rebuilt).not.toBe(first)
  })
})

describe('Label', () => {
  async function renderLabel() {
    return create(
      <>
        <Label
          descriptor={{ text: 'FURY NVMe 2TB', sub: 'PCIe 4.0', width: 3, height: 0.8 }}
          position={[0, 0, 0]}
        />
        {/* Control: an ordinary plane, used to prove the label opts out of picking. */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[3, 0.8]} />
          <meshStandardMaterial />
        </mesh>
      </>,
    )
  }

  it('mounts a non-depth-writing, polygon-offset plane', async () => {
    const renderer = await renderLabel()
    const meshes = renderer.scene.findAllByType('Mesh').map((node) => node.instance as Mesh)

    const labelMesh = meshes.find((mesh) => {
      const material = mesh.material
      return material instanceof MeshStandardMaterial && material.map !== null
    })
    expect(labelMesh).toBeTruthy()

    const material = labelMesh?.material as MeshStandardMaterial
    expect(material.map).toBeInstanceOf(CanvasTexture)
    expect(material.emissiveMap).toBe(material.map)
    expect(material.transparent).toBe(true)
    expect(material.depthWrite).toBe(false)
    expect(material.polygonOffset).toBe(true)

    await renderer.unmount()
  })

  it('cannot be hit by a ray while a sibling plane can', async () => {
    const renderer = await renderLabel()
    const meshes = renderer.scene.findAllByType('Mesh').map((node) => node.instance as Mesh)

    const labelMesh = meshes.find((mesh) => {
      const material = mesh.material
      return material instanceof MeshStandardMaterial && material.map !== null
    })
    const controlMesh = meshes.find((mesh) => mesh !== labelMesh)

    expect(labelMesh).toBeTruthy()
    expect(controlMesh).toBeTruthy()

    // Aim inside one triangle: a ray along the shared diagonal would hit both.
    const ray = new Raycaster(new Vector3(0.5, 0.15, 5), new Vector3(0, 0, -1))
    const labelHits: Intersection[] = []
    const controlHits: Intersection[] = []

    labelMesh?.raycast(ray, labelHits)
    controlMesh?.raycast(ray, controlHits)

    expect(labelHits).toHaveLength(0)
    expect(controlHits.length).toBeGreaterThan(0)

    await renderer.unmount()
  })

  it('renders nothing when no 2D context is available', async () => {
    contextSpy?.mockImplementation(() => null)

    const renderer = await create(
      <Label descriptor={{ text: 'SILENT', width: 3, height: 0.8 }} />,
    )

    expect(renderer.scene.findAllByType('Mesh')).toHaveLength(0)
    await renderer.unmount()
  })
})
