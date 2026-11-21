import { CATEGORY_META, getSlotProduct } from './catalog'
import type {
  CategoryId,
  CompatibilityIssue,
  CompatibilityReport,
  CompatibilityStatus,
  Slots,
} from './types'

/**
 * Demo-level compatibility validation.
 *
 * This is intentionally a handful of honest rules over the seeded catalogue, not
 * a hardware database: it answers "would these parts physically and electrically
 * work together" closely enough to demonstrate the concept, and every surface
 * that shows it labels the result as demo validation.
 */

/** Board, drives, fans, pump and memory overhead attributed to the system. */
const SYSTEM_OVERHEAD_W = 100

/** Headroom a build should leave above its estimated peak draw. */
const PSU_HEADROOM_FACTOR = 1.25

/** Categories a complete build needs before it is worth validating. */
const REQUIRED_CATEGORIES: readonly CategoryId[] = [
  'case',
  'motherboard',
  'cpu',
  'gpu',
  'ram',
  'cooling',
  'storage',
  'psu',
]

export const DEMO_VALIDATION_NOTE =
  'Demo validation only — checks use the seeded catalogue and represent limited, approximate specifications.'

export function evaluateCompatibility(slots: Slots): CompatibilityReport {
  const issues: CompatibilityIssue[] = []

  const pcCase = getSlotProduct(slots, 'case')
  const board = getSlotProduct(slots, 'motherboard')
  const cpu = getSlotProduct(slots, 'cpu')
  const gpu = getSlotProduct(slots, 'gpu')
  const ram = getSlotProduct(slots, 'ram')
  const cooling = getSlotProduct(slots, 'cooling')
  const psu = getSlotProduct(slots, 'psu')

  for (const category of REQUIRED_CATEGORIES) {
    if (!getSlotProduct(slots, category)) {
      issues.push({
        id: `missing-${category}`,
        severity: 'warning',
        title: `${CATEGORY_META[category].singular} missing`,
        detail:
          'This slot is empty, so its compatibility checks are skipped until a part is fitted.',
        categories: [category],
      })
    }
  }

  if (cpu && board && cpu.socket !== board.socket) {
    issues.push({
      id: 'cpu-socket',
      severity: 'error',
      title: 'CPU socket mismatch',
      detail: `${cpu.name} is ${cpu.socket} but ${board.name} only accepts ${board.socket} processors.`,
      categories: ['cpu', 'motherboard'],
    })
  }

  if (ram && board && ram.generation !== board.ramGeneration) {
    issues.push({
      id: 'ram-generation',
      severity: 'error',
      title: 'Memory generation mismatch',
      detail: `${ram.name} is ${ram.generation} but ${board.name} is wired for ${board.ramGeneration}.`,
      categories: ['ram', 'motherboard'],
    })
  }

  if (board && ram && ram.modules > board.dimmSlots) {
    issues.push({
      id: 'ram-slots',
      severity: 'warning',
      title: 'Not enough DIMM slots',
      detail: `This kit needs ${ram.modules} slots but ${board.name} has ${board.dimmSlots}.`,
      categories: ['ram', 'motherboard'],
    })
  }

  if (board && pcCase && !pcCase.formFactors.includes(board.formFactor)) {
    issues.push({
      id: 'board-form-factor',
      severity: 'error',
      title: 'Motherboard will not fit the case',
      detail: `${board.formFactor} is not supported by ${pcCase.name} (${pcCase.formFactors.join(' / ')}).`,
      categories: ['motherboard', 'case'],
    })
  }

  if (gpu && pcCase && gpu.lengthMm > pcCase.maxGpuLengthMm) {
    issues.push({
      id: 'gpu-clearance',
      severity: 'warning',
      title: 'GPU exceeds stated clearance',
      detail: `${gpu.name} is ${gpu.lengthMm} mm long; ${pcCase.name} lists ${pcCase.maxGpuLengthMm} mm of GPU clearance.`,
      categories: ['gpu', 'case'],
    })
  }

  if (cooling && pcCase) {
    if (
      cooling.kind === 'air' &&
      cooling.heightMm !== undefined &&
      cooling.heightMm > pcCase.maxCoolerHeightMm
    ) {
      issues.push({
        id: 'cooler-clearance',
        severity: 'warning',
        title: 'Cooler is too tall for the case',
        detail: `${cooling.name} is ${cooling.heightMm} mm tall; ${pcCase.name} accepts up to ${pcCase.maxCoolerHeightMm} mm.`,
        categories: ['cooling', 'case'],
      })
    }

    if (
      cooling.kind === 'aio' &&
      cooling.radiatorMm !== undefined &&
      !pcCase.radiatorSupportMm.includes(cooling.radiatorMm)
    ) {
      issues.push({
        id: 'radiator-support',
        severity: 'warning',
        title: 'Radiator size unsupported',
        detail: `${pcCase.name} supports ${pcCase.radiatorSupportMm.join(' / ')} mm radiators, not ${cooling.radiatorMm} mm.`,
        categories: ['cooling', 'case'],
      })
    }
  }

  if (cooling && cpu && cooling.tdpRatingW < cpu.tdpW) {
    issues.push({
      id: 'cooling-capacity',
      severity: 'warning',
      title: 'Cooler is under-rated for this CPU',
      detail: `${cooling.name} is rated to ${cooling.tdpRatingW} W while ${cpu.name} draws up to ${cpu.tdpW} W.`,
      categories: ['cooling', 'cpu'],
    })
  }

  const estimatedLoadW =
    (cpu?.tdpW ?? 0) + (gpu?.tdpW ?? 0) + SYSTEM_OVERHEAD_W
  const recommendedPsuW = Math.ceil(
    (estimatedLoadW * PSU_HEADROOM_FACTOR) / 50,
  ) * 50

  if (psu && psu.wattageW < estimatedLoadW) {
    issues.push({
      id: 'psu-wattage',
      severity: 'error',
      title: 'Power supply is undersized',
      detail: `Estimated peak draw is ${estimatedLoadW} W but ${psu.name} delivers ${psu.wattageW} W.`,
      categories: ['psu', 'gpu', 'cpu'],
    })
  } else if (psu && psu.wattageW < recommendedPsuW) {
    issues.push({
      id: 'psu-headroom',
      severity: 'warning',
      title: 'Tight power headroom',
      detail: `Estimated peak draw is ${estimatedLoadW} W; ${recommendedPsuW} W is recommended to keep ${psu.name} out of its loudest range.`,
      categories: ['psu'],
    })
  }

  const errorCount = issues.filter((issue) => issue.severity === 'error').length
  const warningCount = issues.length - errorCount

  return {
    status: resolveStatus(errorCount, warningCount),
    issues,
    errorCount,
    warningCount,
    estimatedLoadW,
    recommendedPsuW,
  }
}

function resolveStatus(
  errorCount: number,
  warningCount: number,
): CompatibilityStatus {
  if (errorCount > 0) return 'incompatible'
  if (warningCount > 0) return 'warning'
  return 'compatible'
}

export function issuesForCategory(
  report: CompatibilityReport,
  category: CategoryId,
): CompatibilityIssue[] {
  return report.issues.filter((issue) => issue.categories.includes(category))
}
