import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_SLOTS } from '@/lib/catalog'
import {
  DEFAULT_APPEARANCE,
  DEFAULT_BUILD_NAME,
  STORAGE_KEY,
  useBuildStore,
} from './useBuildStore'
import { TOTAL_SLOTS, selectFilledCount, selectTotalPrice } from './selectors'

const state = () => useBuildStore.getState()

function resetStore() {
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
  })
}

function readPersisted(): { state: Record<string, unknown> } | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : null
}

beforeEach(() => {
  localStorage.clear()
  resetStore()
})

describe('build store', () => {
  it('ships a complete default build at the expected price', () => {
    expect(selectFilledCount(state())).toBe(TOTAL_SLOTS)
    expect(selectTotalPrice(state())).toBe(2641)
    expect(state().slots.gpu).toBe('gpu-titan-4080-phantom')
  })

  it('swaps a product, selects its slot and recalculates the total', () => {
    state().equip('gpu', 'gpu-titan-4070-mini')

    expect(state().slots.gpu).toBe('gpu-titan-4070-mini')
    expect(state().selectedCategory).toBe('gpu')
    expect(selectTotalPrice(state())).toBe(2191)
  })

  it('ignores a product from the wrong category', () => {
    state().equip('gpu', 'ram-vortex-ddr5-32-rgb')

    expect(state().slots.gpu).toBe('gpu-titan-4080-phantom')
  })

  it('empties a slot on removal and counts it as unfilled', () => {
    state().clearSlot('gpu')

    expect(state().slots.gpu).toBeNull()
    expect(selectFilledCount(state())).toBe(TOTAL_SLOTS - 1)
    expect(selectTotalPrice(state())).toBe(1542)
  })

  it('toggles the glass panel and exploded view', () => {
    expect(state().panelOpen).toBe(false)
    state().togglePanel()
    expect(state().panelOpen).toBe(true)

    expect(state().exploded).toBe(false)
    state().toggleExploded()
    expect(state().exploded).toBe(true)
  })

  it('clamps appearance values to their usable range', () => {
    state().setRgbIntensity(4)
    expect(state().appearance.rgbIntensity).toBe(1)

    state().setLightIntensity(0)
    expect(state().appearance.lightIntensity).toBe(0.2)

    state().setRgbMode('rainbow')
    state().setRgbColor('#f5a524')
    expect(state().appearance.rgbMode).toBe('rainbow')
    expect(state().appearance.rgbColor).toBe('#f5a524')
  })

  it('restores the default build on reset, keeping the saved name', () => {
    state().equip('gpu', 'gpu-titan-4090-colossus')
    state().setRgbMode('rainbow')
    state().toggleExploded()

    state().resetBuild()

    expect(state().slots).toEqual(DEFAULT_SLOTS)
    expect(state().appearance).toEqual(DEFAULT_APPEARANCE)
    expect(state().exploded).toBe(false)
    expect(state().selectedCategory).toBeNull()
    expect(selectTotalPrice(state())).toBe(2641)
  })

  it('persists slot changes to localStorage', () => {
    state().equip('cpu', 'cpu-zenith-5-7600x')

    const persisted = readPersisted()
    if (!persisted) throw new Error('build was not persisted')
    const persistedSlots = persisted.state.slots as Record<string, string>

    expect(persistedSlots.cpu).toBe('cpu-zenith-5-7600x')
  })

  it('drops unknown catalogue ids when rehydrating storage', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state: {
          buildName: 'SALVAGED',
          slots: {
            ...DEFAULT_SLOTS,
            gpu: 'gpu-no-longer-sold',
            cpu: 'cpu-zenith-5-7600x',
          },
          appearance: { ...DEFAULT_APPEARANCE, rgbIntensity: 99 },
          lastSavedAt: null,
        },
      }),
    )

    await useBuildStore.persist.rehydrate()

    expect(state().slots.gpu).toBe(DEFAULT_SLOTS.gpu)
    expect(state().slots.cpu).toBe('cpu-zenith-5-7600x')
    expect(state().appearance.rgbIntensity).toBe(1)
    expect(state().buildName).toBe('SALVAGED')
  })
})
