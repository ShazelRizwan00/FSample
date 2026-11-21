import { describe, expect, it } from 'vitest'
import { DEFAULT_SLOTS } from './catalog'
import { evaluateCompatibility, issuesForCategory } from './compatibility'
import type { Slots } from './types'

function slotsWith(overrides: Partial<Slots>): Slots {
  return { ...DEFAULT_SLOTS, ...overrides }
}

describe('evaluateCompatibility', () => {
  it('passes the default build as fully compatible', () => {
    const report = evaluateCompatibility(slotsWith({}))

    expect(report.status).toBe('compatible')
    expect(report.issues).toEqual([])
    expect(report.estimatedLoadW).toBe(590)
    expect(report.recommendedPsuW).toBe(750)
  })

  it('flags a CPU socket mismatch as incompatible', () => {
    const report = evaluateCompatibility(
      slotsWith({ cpu: 'cpu-apex-i9-14900k' }),
    )

    expect(report.status).toBe('incompatible')
    expect(report.issues.map((issue) => issue.id)).toContain('cpu-socket')
    expect(
      report.issues.find((issue) => issue.id === 'cpu-socket')?.detail,
    ).toContain('LGA1700')
  })

  it('flags DDR4 memory on a DDR5 board as incompatible', () => {
    const report = evaluateCompatibility(
      slotsWith({ ram: 'ram-vortex-ddr4-32-rgb' }),
    )

    expect(report.status).toBe('incompatible')
    expect(report.issues.map((issue) => issue.id)).toContain('ram-generation')
  })

  it('warns, not errors, when a GPU exceeds stated clearance', () => {
    const report = evaluateCompatibility(
      slotsWith({ gpu: 'gpu-titan-4090-colossus' }),
    )

    expect(report.status).toBe('warning')
    expect(report.errorCount).toBe(0)
    expect(issuesForCategory(report, 'gpu')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'gpu-clearance', severity: 'warning' }),
      ]),
    )
  })

  it('does not complain about an mATX board in an ATX-capable case', () => {
    const report = evaluateCompatibility(
      slotsWith({ motherboard: 'mb-nova-b650m' }),
    )

    expect(report.issues.map((issue) => issue.id)).not.toContain(
      'board-form-factor',
    )
  })

  it('reports an empty slot instead of validating it', () => {
    const report = evaluateCompatibility(slotsWith({ gpu: null }))

    expect(report.status).toBe('warning')
    expect(report.issues.map((issue) => issue.id)).toContain('missing-gpu')
    expect(report.estimatedLoadW).toBe(270)
  })

  it('errors when the power supply cannot cover the estimated draw', () => {
    const report = evaluateCompatibility(
      slotsWith({ cpu: 'cpu-apex-i9-14900k', gpu: 'gpu-titan-4090-colossus' }),
    )

    expect(report.estimatedLoadW).toBe(803)
    expect(report.issues.map((issue) => issue.id)).toContain('psu-wattage')
    expect(report.status).toBe('incompatible')
  })

  it('warns when the power supply only just covers the draw', () => {
    const report = evaluateCompatibility(
      slotsWith({ gpu: 'gpu-titan-4090-colossus' }),
    )

    expect(report.estimatedLoadW).toBe(720)
    expect(report.recommendedPsuW).toBe(900)
    expect(report.issues.map((issue) => issue.id)).toEqual(
      expect.arrayContaining(['gpu-clearance', 'psu-headroom']),
    )
  })

  it('accepts the 360 mm liquid cooler on a case that lists it', () => {
    const report = evaluateCompatibility(slotsWith({ cooling: 'cool-loop-360' }))

    expect(report.issues.map((issue) => issue.id)).not.toContain(
      'radiator-support',
    )
    expect(report.status).toBe('compatible')
  })
})
