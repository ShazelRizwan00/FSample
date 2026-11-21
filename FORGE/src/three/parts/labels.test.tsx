import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { create } from '@react-three/test-renderer'
import { Mesh, MeshStandardMaterial } from 'three'
import { PRODUCTS_BY_ID, productModelName } from '@/lib/catalog'
import type { GpuProduct, MotherboardProduct, PsuProduct, StorageProduct } from '@/lib/types'
import { clearLabelCache } from '../decals'
import { CaseChassis } from './CaseChassis'
import { Fan } from './Fan'
import { GpuCard } from './GpuCard'
import { Motherboard } from './Motherboard'
import { PsuUnit } from './PsuUnit'
import { Storage } from './Storage'

/**
 * Label wiring: every printed mark must come from catalogue data for the product
 * actually being rendered — not from hardcoded strings — and parts without a
 * label must stay unlabelled.
 *
 * jsdom has no 2D canvas, so this file installs a recording context: the decal
 * pipeline then mounts its planes for real, and we can assert exactly what ink was
 * drawn for each part.
 */

let drawn: string[] = []

beforeEach(() => {
  drawn = []
  clearLabelCache()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    function (this: HTMLCanvasElement) {
      const ctx = {
        canvas: this,
        font: '',
        textBaseline: 'alphabetic',
        fillStyle: '',
        clearRect: () => undefined,
        fillText(text: string) {
          drawn.push(text)
        },
        fillRect: () => undefined,
      }
      return ctx as unknown as CanvasRenderingContext2D
    } as unknown as HTMLCanvasElement['getContext'],
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  clearLabelCache()
})

const gpu = PRODUCTS_BY_ID['gpu-titan-4090-colossus'] as GpuProduct
const psu = PRODUCTS_BY_ID['psu-volt-1000p'] as PsuProduct
const board = PRODUCTS_BY_ID['mb-nova-x670e'] as MotherboardProduct
const drive = PRODUCTS_BY_ID['ssd-fury-4tb'] as StorageProduct

function labelledMeshes(renderer: Awaited<ReturnType<typeof create>>): Mesh[] {
  return renderer.scene
    .findAllByType('Mesh')
    .map((node) => node.instance as Mesh)
    .filter(
      (mesh) =>
        mesh.material instanceof MeshStandardMaterial && mesh.material.map !== null,
    )
}

describe('catalogue-derived label text', () => {
  it('strips the brand prefix for the model line', () => {
    expect(productModelName(gpu)).toBe('RTX-4090 Colossus')
    expect(productModelName(board)).toBe('X670E Strata')
    expect(productModelName({ brand: 'ZENITH', name: 'Zenith 9 7950X' })).toBe(
      '9 7950X',
    )
    expect(productModelName({ brand: 'ODD', name: 'Unrelated' })).toBe('Unrelated')
  })

  it('brands the graphics card backplate with its own model', async () => {
    const renderer = await create(<GpuCard product={gpu} />)

    expect(drawn).toContain('TITAN')
    expect(drawn).toContain('RTX-4090 Colossus')
    // Backplate branding plus one hub mark per fan.
    expect(labelledMeshes(renderer).length).toBe(1 + gpu.fanCount)

    await renderer.unmount()
  })

  it('prints the PSU rating plate from its wattage and efficiency', async () => {
    const renderer = await create(<PsuUnit product={psu} />)

    expect(drawn).toContain('VOLT')
    expect(drawn).toContain('1000 W · 80+ Platinum')

    await renderer.unmount()
  })

  it('silkscreens the motherboard and its chipset', async () => {
    const renderer = await create(<Motherboard product={board} />)

    expect(drawn).toContain('NOVA')
    expect(drawn).toContain('X670E Strata')

    await renderer.unmount()
  })

  it('labels the drive with its capacity', async () => {
    const renderer = await create(<Storage product={drive} />)

    expect(drawn).toContain('FURY')
    expect(drawn).toContain('4 TB')

    await renderer.unmount()
  })

  it('badges the chassis', async () => {
    const renderer = await create(<CaseChassis glassOpen={false} />)

    expect(drawn).toContain('FORGE')

    await renderer.unmount()
  })

  it('marks a fan hub only when asked to', async () => {
    const bare = await create(<Fan size={12} rgb={false} />)
    expect(drawn).toHaveLength(0)
    await bare.unmount()

    clearLabelCache()
    const branded = await create(<Fan size={12} rgb={false} label="AERO" />)
    expect(drawn).toEqual(['AERO'])
    await branded.unmount()
  })
})
