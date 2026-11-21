import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  DEFAULT_SLOTS,
  PRODUCTS_BY_ID,
  isProductOfCategory,
} from '@/lib/catalog'
import type {
  Appearance,
  BackgroundPreset,
  CategoryId,
  RgbMode,
  Slots,
} from '@/lib/types'
import { CATEGORY_IDS } from '@/lib/types'

export const DEFAULT_BUILD_NAME = 'FORGE REFERENCE BUILD'

/** Rails start closed on compact viewports, where they are overlay drawers. */
const COMPACT_VIEWPORT =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(max-width: 1023px)').matches
export const STORAGE_KEY = 'forge.build.v1'

export const DEFAULT_APPEARANCE: Appearance = {
  rgbMode: 'static',
  rgbColor: '#22d3ee',
  rgbIntensity: 0.7,
  lightIntensity: 1,
  background: 'studio',
}

export const RGB_COLOR_PRESETS = [
  { name: 'Cyan', hex: '#22d3ee' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Amber', hex: '#f5a524' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Mint', hex: '#34d399' },
] as const

export type BuildState = {
  buildName: string
  slots: Slots
  selectedCategory: CategoryId | null
  hoveredCategory: CategoryId | null
  /** Tempered glass side panel: false = closed over the hardware. */
  panelOpen: boolean
  exploded: boolean
  appearance: Appearance
  /** Rail visibility lives here so the inspector can open the browser itself. */
  leftRailOpen: boolean
  rightRailOpen: boolean
  lastSavedAt: string | null
  /** Bumped to ask the 3D stage to glide the camera back to its default frame. */
  cameraResetToken: number
  /** Set on double-click so the stage frames that component; token replays repeats. */
  focusRequest: { category: CategoryId; token: number } | null
  /** Set by the inspector so the browser opens and scrolls to that slot. */
  revealRequest: { category: CategoryId; token: number } | null

  equip: (category: CategoryId, productId: string) => void
  clearSlot: (category: CategoryId) => void
  selectCategory: (category: CategoryId | null) => void
  setHovered: (category: CategoryId | null) => void
  togglePanel: () => void
  setPanelOpen: (open: boolean) => void
  toggleExploded: () => void
  setExploded: (exploded: boolean) => void
  setRgbMode: (mode: RgbMode) => void
  setRgbColor: (hex: string) => void
  setRgbIntensity: (value: number) => void
  setLightIntensity: (value: number) => void
  setBackground: (preset: BackgroundPreset) => void
  setBuildName: (name: string) => void
  toggleLeftRail: () => void
  toggleRightRail: () => void
  setLeftRailOpen: (open: boolean) => void
  resetCamera: () => void
  requestFocus: (category: CategoryId) => void
  revealInBrowser: (category: CategoryId) => void
  resetBuild: () => void
  saveBuild: () => void
}

type PersistedBuild = Pick<
  BuildState,
  'buildName' | 'slots' | 'appearance' | 'lastSavedAt'
>

export const useBuildStore = create<BuildState>()(
  persist(
    (set) => ({
      buildName: DEFAULT_BUILD_NAME,
      slots: { ...DEFAULT_SLOTS },
      selectedCategory: null,
      hoveredCategory: null,
      panelOpen: false,
      exploded: false,
      appearance: { ...DEFAULT_APPEARANCE },
      leftRailOpen: !COMPACT_VIEWPORT,
      rightRailOpen: !COMPACT_VIEWPORT,
      lastSavedAt: null,
      cameraResetToken: 0,
      focusRequest: null,
      revealRequest: null,

      equip: (category, productId) => {
        if (!isProductOfCategory(productId, category)) return
        set((state) => ({
          slots: { ...state.slots, [category]: productId },
          selectedCategory: category,
        }))
      },

      clearSlot: (category) =>
        set((state) => ({
          slots: { ...state.slots, [category]: null },
          selectedCategory:
            state.selectedCategory === category ? null : state.selectedCategory,
        })),

      selectCategory: (category) => set({ selectedCategory: category }),

      setHovered: (category) => set({ hoveredCategory: category }),

      togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),

      setPanelOpen: (open) => set({ panelOpen: open }),

      toggleExploded: () => set((state) => ({ exploded: !state.exploded })),

      setExploded: (exploded) => set({ exploded }),

      setRgbMode: (mode) =>
        set((state) => ({
          appearance: { ...state.appearance, rgbMode: mode },
        })),

      setRgbColor: (hex) =>
        set((state) => ({
          appearance: { ...state.appearance, rgbColor: hex },
        })),

      setRgbIntensity: (value) =>
        set((state) => ({
          appearance: {
            ...state.appearance,
            rgbIntensity: clamp(value, 0, 1),
          },
        })),

      setLightIntensity: (value) =>
        set((state) => ({
          appearance: {
            ...state.appearance,
            lightIntensity: clamp(value, 0.2, 2),
          },
        })),

      setBackground: (preset) =>
        set((state) => ({
          appearance: { ...state.appearance, background: preset },
        })),

      setBuildName: (name) => set({ buildName: name.slice(0, 40) }),

      toggleLeftRail: () => set((state) => ({ leftRailOpen: !state.leftRailOpen })),

      toggleRightRail: () =>
        set((state) => ({ rightRailOpen: !state.rightRailOpen })),

      setLeftRailOpen: (open) => set({ leftRailOpen: open }),

      resetCamera: () =>
        set((state) => ({ cameraResetToken: state.cameraResetToken + 1 })),

      requestFocus: (category) =>
        set((state) => ({
          focusRequest: { category, token: (state.focusRequest?.token ?? 0) + 1 },
        })),

      revealInBrowser: (category) =>
        set((state) => ({
          revealRequest: {
            category,
            token: (state.revealRequest?.token ?? 0) + 1,
          },
        })),

      resetBuild: () =>
        set({
          slots: { ...DEFAULT_SLOTS },
          selectedCategory: null,
          hoveredCategory: null,
          panelOpen: false,
          exploded: false,
          appearance: { ...DEFAULT_APPEARANCE },
        }),

      saveBuild: () => set({ lastSavedAt: new Date().toISOString() }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedBuild => ({
        buildName: state.buildName,
        slots: state.slots,
        appearance: state.appearance,
        lastSavedAt: state.lastSavedAt,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...normalisePersisted(persisted),
      }),
    },
  ),
)

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}

/**
 * Storage is user-editable and catalogue ids can disappear between versions, so
 * rehydration keeps only ids that still exist in their own category and falls
 * back to the default part instead of rendering a broken build.
 */
function normalisePersisted(persisted: unknown): Partial<PersistedBuild> {
  if (!persisted || typeof persisted !== 'object') return {}

  const raw = persisted as Partial<PersistedBuild>
  const result: Partial<PersistedBuild> = {}

  if (typeof raw.buildName === 'string' && raw.buildName.trim().length > 0) {
    result.buildName = raw.buildName.slice(0, 40)
  }

  if (raw.slots && typeof raw.slots === 'object') {
    const slots = { ...DEFAULT_SLOTS }
    for (const category of CATEGORY_IDS) {
      const candidate = (raw.slots as Record<string, unknown>)[category]
      if (typeof candidate === 'string' && PRODUCTS_BY_ID[candidate]) {
        slots[category] = candidate
      }
    }
    result.slots = slots
  }

  if (raw.appearance && typeof raw.appearance === 'object') {
    const appearance = raw.appearance as Partial<Appearance>
    result.appearance = {
      rgbMode: isRgbMode(appearance.rgbMode)
        ? appearance.rgbMode
        : DEFAULT_APPEARANCE.rgbMode,
      rgbColor:
        typeof appearance.rgbColor === 'string' &&
        /^#[0-9a-f]{6}$/i.test(appearance.rgbColor)
          ? appearance.rgbColor
          : DEFAULT_APPEARANCE.rgbColor,
      rgbIntensity:
        typeof appearance.rgbIntensity === 'number'
          ? clamp(appearance.rgbIntensity, 0, 1)
          : DEFAULT_APPEARANCE.rgbIntensity,
      lightIntensity:
        typeof appearance.lightIntensity === 'number'
          ? clamp(appearance.lightIntensity, 0.2, 2)
          : DEFAULT_APPEARANCE.lightIntensity,
      background: isBackground(appearance.background)
        ? appearance.background
        : DEFAULT_APPEARANCE.background,
    }
  }

  if (typeof raw.lastSavedAt === 'string') {
    result.lastSavedAt = raw.lastSavedAt
  }

  return result
}

function isRgbMode(value: unknown): value is RgbMode {
  return value === 'off' || value === 'static' || value === 'rainbow'
}

function isBackground(value: unknown): value is BackgroundPreset {
  return value === 'studio' || value === 'void' || value === 'grid'
}
