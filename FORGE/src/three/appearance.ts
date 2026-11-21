import { Color } from 'three'
import type { BackgroundPreset, CategoryId, RgbMode } from '@/lib/types'
import { EXPLODE_OFFSETS } from './mounts'

/**
 * Appearance maths, kept free of React and Three scene objects so the behaviour
 * (off/static/rainbow, explode distance, background presets) can be reasoned
 * about and tested directly.
 */

/** Seconds for one full hue revolution in rainbow mode. */
export const RAINBOW_PERIOD_S = 9

export type BackgroundTheme = {
  label: string
  description: string
  background: string
  fog: string
  floor: string
  /** Reflective deck strength for that environment. */
  mirror: number
}

export const BACKGROUND_THEMES: Record<BackgroundPreset, BackgroundTheme> = {
  studio: {
    label: 'Studio',
    description: 'Neutral product stage',
    background: '#080b10',
    fog: '#080b10',
    floor: '#0a0e14',
    mirror: 0.32,
  },
  void: {
    label: 'Void',
    description: 'Near-black isolation',
    background: '#04060a',
    fog: '#04060a',
    floor: '#05080c',
    mirror: 0.46,
  },
  grid: {
    label: 'Hangar',
    description: 'Cool blue technical bay',
    background: '#0b1220',
    fog: '#0b1220',
    floor: '#101a2a',
    mirror: 0.22,
  },
}

const rainbowColor = new Color()

/**
 * Colour an RGB diffuser should display for a given mode and time.
 * Returns `null` when the lighting is off, which callers translate into zero
 * emissive intensity rather than a black tint (keeping base colours intact).
 */
export function rgbColorAt(
  mode: RgbMode,
  baseHex: string,
  elapsedSeconds: number,
): string | null {
  if (mode === 'off') return null
  if (mode === 'static') return baseHex

  const hue = ((elapsedSeconds / RAINBOW_PERIOD_S) % 1 + 1) % 1
  rainbowColor.setHSL(hue, 0.92, 0.58)
  return `#${rainbowColor.getHexString()}`
}

/** Emissive strength applied to RGB materials for a mode and user intensity. */
export function rgbEmissiveIntensity(
  mode: RgbMode,
  intensity: number,
  base = 1.4,
): number {
  if (mode === 'off') return 0
  return base * (0.25 + Math.min(1, Math.max(0, intensity)) * 1.5)
}

/** Offset applied to a slot at a given explode progress (0 = assembled). */
export function explodeOffset(
  category: CategoryId,
  progress: number,
): [number, number, number] {
  const clamped = Math.min(1, Math.max(0, progress))
  // Multiplying a negative offset by zero yields -0; keep zeros positive.
  const scale = (value: number) => (clamped === 0 ? 0 : value * clamped)
  const [x, y, z] = EXPLODE_OFFSETS[category]
  return [scale(x), scale(y), scale(z)]
}
