/**
 * FORGE domain model.
 *
 * Every product is a discriminated union member keyed by `category`, so the
 * compatibility engine and the 3D parts can narrow to exactly the fields they
 * need without optional-field guesswork. `variant` is the geometry selector the
 * procedural parts read; it is deliberately independent of `id` so two products
 * can share hardware geometry while staying distinct catalogue entries.
 */

export const CATEGORY_IDS = [
  'case',
  'motherboard',
  'cpu',
  'gpu',
  'ram',
  'cooling',
  'storage',
  'psu',
  'fan',
] as const

export type CategoryId = (typeof CATEGORY_IDS)[number]

export type FormFactor = 'ATX' | 'mATX' | 'ITX'
export type CpuSocket = 'AM5' | 'LGA1700'
export type RamGeneration = 'DDR5' | 'DDR4'
export type RadiatorSizeMm = 240 | 360

export type SpecRow = { label: string; value: string }

/** Millimetres, matching the 1 scene unit = 1 cm scale used by the 3D stage. */
export type Dimensions = { width: number; height: number; depth: number }

export type Slots = Record<CategoryId, string | null>

type BaseProduct = {
  id: string
  name: string
  brand: string
  /** USD. Every price in this catalogue is an illustrative demo price. */
  price: number
  /** Geometry selector consumed by the procedural parts in `src/three/parts`. */
  variant: string
  blurb: string
  specs: SpecRow[]
  dimensionsMm?: Dimensions
}

export type CaseProduct = BaseProduct & {
  category: 'case'
  formFactors: FormFactor[]
  maxGpuLengthMm: number
  maxCoolerHeightMm: number
  radiatorSupportMm: RadiatorSizeMm[]
  frontFanMounts: number
  rearFanMounts: number
}

export type MotherboardProduct = BaseProduct & {
  category: 'motherboard'
  formFactor: FormFactor
  socket: CpuSocket
  ramGeneration: RamGeneration
  dimmSlots: number
  pcieSlots: number
  m2Slots: number
}

export type CpuProduct = BaseProduct & {
  category: 'cpu'
  socket: CpuSocket
  tdpW: number
  cores: number
  threads: number
  boostGhz: number
}

export type GpuProduct = BaseProduct & {
  category: 'gpu'
  lengthMm: number
  tdpW: number
  vramGb: number
  fanCount: number
  slotWidth: number
}

export type RamProduct = BaseProduct & {
  category: 'ram'
  generation: RamGeneration
  modules: number
  capacityGb: number
  speedMt: number
  hasRgb: boolean
}

export type CoolingProduct = BaseProduct & {
  category: 'cooling'
  kind: 'air' | 'aio'
  /** Air coolers only. */
  heightMm?: number
  /** Liquid coolers only. */
  radiatorMm?: RadiatorSizeMm
  tdpRatingW: number
  fanCount: number
}

export type StorageProduct = BaseProduct & {
  category: 'storage'
  capacityGb: number
  interface: 'PCIe 4.0 x4' | 'PCIe 5.0 x4'
  formFactor: 'M.2 2280'
}

export type PsuProduct = BaseProduct & {
  category: 'psu'
  wattageW: number
  efficiency: string
  modular: string
}

export type FanProduct = BaseProduct & {
  category: 'fan'
  /** A single catalogue entry covers the whole intake trio of the case. */
  sizeMm: number
  airflowCfm: number
  hasRgb: boolean
}

export type Product =
  | CaseProduct
  | MotherboardProduct
  | CpuProduct
  | GpuProduct
  | RamProduct
  | CoolingProduct
  | StorageProduct
  | PsuProduct
  | FanProduct

export type ProductOf<C extends CategoryId> = Extract<Product, { category: C }>

export type CategoryMeta = {
  id: CategoryId
  label: string
  singular: string
  description: string
  /** Lucide icon name, resolved by the component browser. */
  icon: string
}

export type RgbMode = 'off' | 'static' | 'rainbow'
export type BackgroundPreset = 'studio' | 'void' | 'grid'

export type Appearance = {
  rgbMode: RgbMode
  rgbColor: string
  rgbIntensity: number
  lightIntensity: number
  background: BackgroundPreset
}

export type IssueSeverity = 'warning' | 'error'

export type CompatibilityIssue = {
  id: string
  severity: IssueSeverity
  title: string
  detail: string
  /** Categories a warning hangs off, so the inspector can surface it inline. */
  categories: CategoryId[]
}

export type CompatibilityStatus = 'compatible' | 'warning' | 'incompatible'

export type CompatibilityReport = {
  status: CompatibilityStatus
  issues: CompatibilityIssue[]
  errorCount: number
  warningCount: number
  /** Estimated peak draw used by the PSU rule. */
  estimatedLoadW: number
  /** Draw plus headroom, i.e. the wattage a build should really provide. */
  recommendedPsuW: number
}

/** A slot paired with whatever product currently fills it. */
export type EquippedPart = {
  category: CategoryId
  product: Product
}
