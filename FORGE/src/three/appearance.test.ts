import { describe, expect, it } from 'vitest'
import { EXPLODE_OFFSETS } from './mounts'
import {
  BACKGROUND_THEMES,
  RAINBOW_PERIOD_S,
  explodeOffset,
  rgbColorAt,
  rgbEmissiveIntensity,
} from './appearance'

/**
 * Appearance maths: the behaviour behind the RGB and exploded-view controls.
 */

describe('rgbColorAt', () => {
  it('returns nothing when the lighting is off', () => {
    expect(rgbColorAt('off', '#22d3ee', 3)).toBeNull()
  })

  it('holds the chosen colour in static mode', () => {
    expect(rgbColorAt('static', '#f5a524', 0)).toBe('#f5a524')
    expect(rgbColorAt('static', '#f5a524', 12)).toBe('#f5a524')
  })

  it('cycles through hues in rainbow mode', () => {
    const start = rgbColorAt('rainbow', '#22d3ee', 0)
    const quarter = rgbColorAt('rainbow', '#22d3ee', RAINBOW_PERIOD_S / 4)
    const half = rgbColorAt('rainbow', '#22d3ee', RAINBOW_PERIOD_S / 2)

    expect(start).toMatch(/^#[0-9a-f]{6}$/)
    expect(quarter).not.toBe(start)
    expect(half).not.toBe(start)
    // One full period returns to the starting hue.
    expect(rgbColorAt('rainbow', '#22d3ee', RAINBOW_PERIOD_S)).toBe(start)
  })

  it('ignores negative elapsed time', () => {
    expect(rgbColorAt('rainbow', '#22d3ee', -1)).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe('rgbEmissiveIntensity', () => {
  it('is zero when off', () => {
    expect(rgbEmissiveIntensity('off', 0.7)).toBe(0)
  })

  it('scales with the user intensity', () => {
    const low = rgbEmissiveIntensity('static', 0.2, 1.4)
    const high = rgbEmissiveIntensity('static', 1, 1.4)

    expect(low).toBeGreaterThan(0)
    expect(high).toBeGreaterThan(low)
  })

  it('clamps out-of-range intensity', () => {
    expect(rgbEmissiveIntensity('static', 5, 1.4)).toBe(
      rgbEmissiveIntensity('static', 1, 1.4),
    )
    expect(rgbEmissiveIntensity('static', -2, 1.4)).toBe(
      rgbEmissiveIntensity('static', 0, 1.4),
    )
  })
})

describe('explodeOffset', () => {
  it('is zero when assembled', () => {
    expect(explodeOffset('gpu', 0)).toEqual([0, 0, 0])
  })

  it('reaches the configured offset when fully exploded', () => {
    const [x, y, z] = EXPLODE_OFFSETS.gpu
    expect(explodeOffset('gpu', 1)).toEqual([x, y, z])
  })

  it('interpolates linearly in between', () => {
    const [x, y, z] = EXPLODE_OFFSETS.ram
    expect(explodeOffset('ram', 0.5)).toEqual([x * 0.5, y * 0.5, z * 0.5])
  })

  it('leaves the chassis in place', () => {
    expect(explodeOffset('case', 1)).toEqual([0, 0, 0])
  })

  it('clamps progress outside 0..1', () => {
    const [x, y, z] = EXPLODE_OFFSETS.gpu
    expect(explodeOffset('gpu', 2)).toEqual([x, y, z])
    expect(explodeOffset('gpu', -1)).toEqual([0, 0, 0])
  })
})

describe('background themes', () => {
  it('defines a complete theme per preset', () => {
    for (const theme of Object.values(BACKGROUND_THEMES)) {
      expect(theme.background).toMatch(/^#[0-9a-f]{6}$/)
      expect(theme.fog).toMatch(/^#[0-9a-f]{6}$/)
      expect(theme.floor).toMatch(/^#[0-9a-f]{6}$/)
      expect(theme.mirror).toBeGreaterThan(0)
      expect(theme.label.length).toBeGreaterThan(0)
    }
  })
})
