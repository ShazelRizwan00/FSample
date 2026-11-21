import {
  CATEGORY_IDS,
  type CategoryId,
  type CategoryMeta,
  type Product,
  type ProductOf,
  type Slots,
} from './types'

/**
 * Seeded demo catalogue.
 *
 * These are representative parts, not retailer inventory: names, prices and
 * dimensions are illustrative and exist to make the configurator demonstrable.
 * Prices are USD and the UI labels them as demo pricing.
 */

export const CATEGORY_ORDER: readonly CategoryId[] = CATEGORY_IDS

export const CATEGORY_META: Record<CategoryId, CategoryMeta> = {
  case: {
    id: 'case',
    label: 'Cases',
    singular: 'Case',
    description: 'Chassis, airflow and clearance limits',
    icon: 'Box',
  },
  motherboard: {
    id: 'motherboard',
    label: 'Motherboards',
    singular: 'Motherboard',
    description: 'Socket, memory generation and form factor',
    icon: 'CircuitBoard',
  },
  cpu: {
    id: 'cpu',
    label: 'CPUs',
    singular: 'CPU',
    description: 'Processor socket and thermal load',
    icon: 'Cpu',
  },
  gpu: {
    id: 'gpu',
    label: 'GPUs',
    singular: 'Graphics card',
    description: 'Render hardware, length and power draw',
    icon: 'Gpu',
  },
  ram: {
    id: 'ram',
    label: 'Memory',
    singular: 'Memory kit',
    description: 'DIMM kits, generation and RGB',
    icon: 'MemoryStick',
  },
  cooling: {
    id: 'cooling',
    label: 'Cooling',
    singular: 'Cooler',
    description: 'Air towers and liquid loops',
    icon: 'Fan',
  },
  storage: {
    id: 'storage',
    label: 'Storage',
    singular: 'Drive',
    description: 'NVMe drives seated on the board',
    icon: 'HardDrive',
  },
  psu: {
    id: 'psu',
    label: 'Power',
    singular: 'Power supply',
    description: 'Wattage headroom for the build',
    icon: 'Zap',
  },
  fan: {
    id: 'fan',
    label: 'Case fans',
    singular: 'Fan kit',
    description: 'Intake trio for the front mount',
    icon: 'Wind',
  },
}

export const PRODUCTS: readonly Product[] = [
  // ── Cases ────────────────────────────────────────────────────────────────
  {
    id: 'case-vector-m1',
    category: 'case',
    brand: 'FORGE LABS',
    name: 'Vector M1 Mid-Tower',
    price: 149,
    variant: 'mid-tower',
    blurb:
      'Steel frame, edge-to-edge tempered glass and a front mesh intake sized for a 360 mm radiator.',
    formFactors: ['ATX', 'mATX', 'ITX'],
    maxGpuLengthMm: 340,
    maxCoolerHeightMm: 168,
    radiatorSupportMm: [240, 360],
    frontFanMounts: 3,
    rearFanMounts: 1,
    dimensionsMm: { width: 220, height: 470, depth: 460 },
    specs: [
      { label: 'Form factor', value: 'Mid-tower' },
      { label: 'Board support', value: 'ATX / mATX / ITX' },
      { label: 'GPU clearance', value: '340 mm' },
      { label: 'Cooler clearance', value: '168 mm' },
      { label: 'Radiator support', value: '240 / 360 mm' },
    ],
  },

  // ── Motherboards ─────────────────────────────────────────────────────────
  {
    id: 'mb-nova-x670e',
    category: 'motherboard',
    brand: 'NOVA',
    name: 'Nova X670E Strata',
    price: 329,
    variant: 'atx-am5',
    blurb:
      'Full ATX AM5 board with a 16+2 stage VRM, four DIMM slots and three M.2 sockets under heatshields.',
    formFactor: 'ATX',
    socket: 'AM5',
    ramGeneration: 'DDR5',
    dimmSlots: 4,
    pcieSlots: 3,
    m2Slots: 3,
    dimensionsMm: { width: 305, height: 244, depth: 30 },
    specs: [
      { label: 'Form factor', value: 'ATX' },
      { label: 'Socket', value: 'AM5' },
      { label: 'Memory', value: '4 × DDR5' },
      { label: 'Expansion', value: '3 × PCIe 5.0' },
      { label: 'Storage', value: '3 × M.2' },
    ],
  },
  {
    id: 'mb-nova-b650m',
    category: 'motherboard',
    brand: 'NOVA',
    name: 'Nova B650M Core',
    price: 189,
    variant: 'matx-am5',
    blurb:
      'Compact mATX AM5 board for smaller builds, keeping DDR5 and PCIe 4.0 storage support.',
    formFactor: 'mATX',
    socket: 'AM5',
    ramGeneration: 'DDR5',
    dimmSlots: 4,
    pcieSlots: 2,
    m2Slots: 2,
    dimensionsMm: { width: 244, height: 244, depth: 30 },
    specs: [
      { label: 'Form factor', value: 'mATX' },
      { label: 'Socket', value: 'AM5' },
      { label: 'Memory', value: '4 × DDR5' },
      { label: 'Expansion', value: '2 × PCIe 4.0' },
      { label: 'Storage', value: '2 × M.2' },
    ],
  },

  // ── CPUs ─────────────────────────────────────────────────────────────────
  {
    id: 'cpu-zenith-9-7950x',
    category: 'cpu',
    brand: 'ZENITH',
    name: 'Zenith 9 7950X',
    price: 549,
    variant: 'am5-16c',
    blurb:
      'Sixteen-core AM5 flagship with a 170 W envelope — the thermal baseline for this chassis.',
    socket: 'AM5',
    tdpW: 170,
    cores: 16,
    threads: 32,
    boostGhz: 5.7,
    dimensionsMm: { width: 40, height: 40, depth: 8 },
    specs: [
      { label: 'Socket', value: 'AM5' },
      { label: 'Cores', value: '16C / 32T' },
      { label: 'Boost', value: '5.7 GHz' },
      { label: 'TDP', value: '170 W' },
      { label: 'Memory', value: 'DDR5' },
    ],
  },
  {
    id: 'cpu-zenith-5-7600x',
    category: 'cpu',
    brand: 'ZENITH',
    name: 'Zenith 5 7600X',
    price: 229,
    variant: 'am5-6c',
    blurb:
      'Six-core AM5 part that trades peak throughput for efficiency and easier cooling.',
    socket: 'AM5',
    tdpW: 105,
    cores: 6,
    threads: 12,
    boostGhz: 5.3,
    dimensionsMm: { width: 40, height: 40, depth: 8 },
    specs: [
      { label: 'Socket', value: 'AM5' },
      { label: 'Cores', value: '6C / 12T' },
      { label: 'Boost', value: '5.3 GHz' },
      { label: 'TDP', value: '105 W' },
      { label: 'Memory', value: 'DDR5' },
    ],
  },
  {
    id: 'cpu-apex-i9-14900k',
    category: 'cpu',
    brand: 'APEX',
    name: 'Apex i9-14900K',
    price: 589,
    variant: 'lga1700-24c',
    blurb:
      'Twenty-four cores on LGA1700. Included as a deliberate platform-mismatch case for the demo.',
    socket: 'LGA1700',
    tdpW: 253,
    cores: 24,
    threads: 32,
    boostGhz: 6.0,
    dimensionsMm: { width: 37, height: 37, depth: 8 },
    specs: [
      { label: 'Socket', value: 'LGA1700' },
      { label: 'Cores', value: '24C / 32T' },
      { label: 'Boost', value: '6.0 GHz' },
      { label: 'TDP', value: '253 W' },
      { label: 'Memory', value: 'DDR5' },
    ],
  },

  // ── GPUs ─────────────────────────────────────────────────────────────────
  {
    id: 'gpu-titan-4080-phantom',
    category: 'gpu',
    brand: 'TITAN',
    name: 'Titan RTX-4080 Phantom',
    price: 1099,
    variant: 'triple-fan-336',
    blurb:
      'Triple-fan 336 mm card with a milled backplate and a full-length vapour chamber.',
    lengthMm: 336,
    tdpW: 320,
    vramGb: 16,
    fanCount: 3,
    slotWidth: 3,
    powerConnectors: 1,
    dimensionsMm: { width: 336, height: 140, depth: 62 },
    specs: [
      { label: 'Memory', value: '16 GB' },
      { label: 'Length', value: '336 mm' },
      { label: 'Slots', value: '3-slot' },
      { label: 'Fans', value: '3 × 100 mm' },
      { label: 'Board power', value: '320 W' },
    ],
  },
  {
    id: 'gpu-titan-4070-mini',
    category: 'gpu',
    brand: 'TITAN',
    name: 'Titan RTX-4070 Mini',
    price: 649,
    variant: 'dual-fan-244',
    blurb:
      'Short 244 mm dual-fan card that leaves the front intake completely unobstructed.',
    lengthMm: 244,
    tdpW: 200,
    vramGb: 12,
    fanCount: 2,
    slotWidth: 2,
    powerConnectors: 1,
    dimensionsMm: { width: 244, height: 120, depth: 48 },
    specs: [
      { label: 'Memory', value: '12 GB' },
      { label: 'Length', value: '244 mm' },
      { label: 'Slots', value: '2-slot' },
      { label: 'Fans', value: '2 × 92 mm' },
      { label: 'Board power', value: '200 W' },
    ],
  },
  {
    id: 'gpu-titan-4090-colossus',
    category: 'gpu',
    brand: 'TITAN',
    name: 'Titan RTX-4090 Colossus',
    price: 1699,
    variant: 'triple-fan-358',
    blurb:
      '358 mm flagship — deliberately longer than this chassis allows, so the clearance check has something to catch.',
    lengthMm: 358,
    tdpW: 450,
    vramGb: 24,
    fanCount: 3,
    slotWidth: 4,
    powerConnectors: 2,
    dimensionsMm: { width: 358, height: 162, depth: 76 },
    specs: [
      { label: 'Memory', value: '24 GB' },
      { label: 'Length', value: '358 mm' },
      { label: 'Slots', value: '4-slot' },
      { label: 'Fans', value: '3 × 110 mm' },
      { label: 'Board power', value: '450 W' },
    ],
  },

  // ── Memory ───────────────────────────────────────────────────────────────
  {
    id: 'ram-vortex-ddr5-32-rgb',
    category: 'ram',
    brand: 'VORTEX',
    name: 'Vortex DDR5-6000 32GB',
    price: 119,
    variant: 'ddr5-rgb-2',
    blurb:
      'Two 16 GB DDR5 modules with a diffused RGB light bar across the heat spreader.',
    generation: 'DDR5',
    modules: 2,
    capacityGb: 32,
    speedMt: 6000,
    hasRgb: true,
    dimensionsMm: { width: 133, height: 42, depth: 8 },
    specs: [
      { label: 'Generation', value: 'DDR5' },
      { label: 'Kit', value: '2 × 16 GB' },
      { label: 'Speed', value: '6000 MT/s' },
      { label: 'Lighting', value: 'Addressable RGB' },
    ],
  },
  {
    id: 'ram-vortex-ddr5-32-quad',
    category: 'ram',
    brand: 'VORTEX',
    name: 'Vortex DDR5-5600 32GB Quad',
    price: 139,
    variant: 'ddr5-rgb-4',
    blurb:
      'Four 8 GB modules that fill every DIMM slot — the widest memory footprint in the catalogue.',
    generation: 'DDR5',
    modules: 4,
    capacityGb: 32,
    speedMt: 5600,
    hasRgb: true,
    dimensionsMm: { width: 133, height: 40, depth: 8 },
    specs: [
      { label: 'Generation', value: 'DDR5' },
      { label: 'Kit', value: '4 × 8 GB' },
      { label: 'Speed', value: '5600 MT/s' },
      { label: 'Lighting', value: 'Addressable RGB' },
    ],
  },
  {
    id: 'ram-vortex-ddr4-32-rgb',
    category: 'ram',
    brand: 'VORTEX',
    name: 'Vortex DDR4-3600 32GB',
    price: 79,
    variant: 'ddr4-rgb-2',
    blurb:
      'Previous-generation DDR4 kit, kept here so the memory-generation check is demonstrable.',
    generation: 'DDR4',
    modules: 2,
    capacityGb: 32,
    speedMt: 3600,
    hasRgb: true,
    dimensionsMm: { width: 133, height: 44, depth: 8 },
    specs: [
      { label: 'Generation', value: 'DDR4' },
      { label: 'Kit', value: '2 × 16 GB' },
      { label: 'Speed', value: '3600 MT/s' },
      { label: 'Lighting', value: 'Addressable RGB' },
    ],
  },

  // ── Cooling ──────────────────────────────────────────────────────────────
  {
    id: 'cool-air-t6',
    category: 'cooling',
    brand: 'CRYO',
    name: 'Cryo Tower T6',
    price: 89,
    variant: 'air-tower',
    blurb:
      'Single-tower air cooler with six heatpipes and a 120 mm fan — 165 mm tall.',
    kind: 'air',
    heightMm: 165,
    tdpRatingW: 250,
    fanCount: 1,
    dimensionsMm: { width: 120, height: 165, depth: 140 },
    specs: [
      { label: 'Type', value: 'Air tower' },
      { label: 'Height', value: '165 mm' },
      { label: 'Heatpipes', value: '6 × 6 mm' },
      { label: 'Fan', value: '1 × 120 mm' },
      { label: 'Rating', value: '250 W' },
    ],
  },
  {
    id: 'cool-loop-360',
    category: 'cooling',
    brand: 'CRYO',
    name: 'Cryo Loop 360',
    price: 179,
    variant: 'aio-360',
    blurb:
      '360 mm liquid loop with a three-fan radiator, pump block and braided tubing.',
    kind: 'aio',
    radiatorMm: 360,
    tdpRatingW: 320,
    fanCount: 3,
    dimensionsMm: { width: 397, height: 120, depth: 27 },
    specs: [
      { label: 'Type', value: 'Liquid AIO' },
      { label: 'Radiator', value: '360 mm' },
      { label: 'Fans', value: '3 × 120 mm' },
      { label: 'Pump', value: '2800 RPM' },
      { label: 'Rating', value: '320 W' },
    ],
  },

  // ── Storage ──────────────────────────────────────────────────────────────
  {
    id: 'ssd-fury-2tb',
    category: 'storage',
    brand: 'FURY',
    name: 'Fury NVMe 2TB',
    price: 129,
    variant: 'm2-2280-2tb',
    blurb:
      'PCIe 4.0 NVMe drive seated under the board heatshield.',
    capacityGb: 2000,
    interface: 'PCIe 4.0 x4',
    formFactor: 'M.2 2280',
    dimensionsMm: { width: 80, height: 22, depth: 3 },
    specs: [
      { label: 'Capacity', value: '2 TB' },
      { label: 'Interface', value: 'PCIe 4.0 x4' },
      { label: 'Form factor', value: 'M.2 2280' },
      { label: 'Read', value: '7,400 MB/s' },
    ],
  },
  {
    id: 'ssd-fury-4tb',
    category: 'storage',
    brand: 'FURY',
    name: 'Fury NVMe 4TB Pro',
    price: 249,
    variant: 'm2-2280-4tb',
    blurb:
      'Double-capacity PCIe 5.0 drive with a taller heatsink for sustained transfers.',
    capacityGb: 4000,
    interface: 'PCIe 5.0 x4',
    formFactor: 'M.2 2280',
    dimensionsMm: { width: 80, height: 24, depth: 3 },
    specs: [
      { label: 'Capacity', value: '4 TB' },
      { label: 'Interface', value: 'PCIe 5.0 x4' },
      { label: 'Form factor', value: 'M.2 2280' },
      { label: 'Read', value: '11,800 MB/s' },
    ],
  },

  // ── Power ────────────────────────────────────────────────────────────────
  {
    id: 'psu-volt-750g',
    category: 'psu',
    brand: 'VOLT',
    name: 'Volt 750G Gold',
    price: 109,
    variant: 'psu-750',
    blurb:
      '750 W Gold unit with a fully modular harness and a 120 mm fluid-dynamic fan.',
    wattageW: 750,
    efficiency: '80+ Gold',
    modular: 'Fully modular',
    dimensionsMm: { width: 150, height: 86, depth: 160 },
    specs: [
      { label: 'Wattage', value: '750 W' },
      { label: 'Efficiency', value: '80+ Gold' },
      { label: 'Modularity', value: 'Fully modular' },
      { label: 'Standard', value: 'ATX 3.0' },
    ],
  },
  {
    id: 'psu-volt-1000p',
    category: 'psu',
    brand: 'VOLT',
    name: 'Volt 1000P Platinum',
    price: 189,
    variant: 'psu-1000',
    blurb:
      '1000 W Platinum unit for flagship cards, with native 12V-2×6 cabling.',
    wattageW: 1000,
    efficiency: '80+ Platinum',
    modular: 'Fully modular',
    dimensionsMm: { width: 150, height: 86, depth: 180 },
    specs: [
      { label: 'Wattage', value: '1000 W' },
      { label: 'Efficiency', value: '80+ Platinum' },
      { label: 'Modularity', value: 'Fully modular' },
      { label: 'Standard', value: 'ATX 3.0' },
    ],
  },

  // ── Case fans ────────────────────────────────────────────────────────────
  {
    id: 'fan-aero-argb-120',
    category: 'fan',
    brand: 'AERO',
    name: 'Aero ARGB 120 Trio',
    price: 69,
    variant: 'fan-120-argb',
    blurb:
      'Three 120 mm balanced fans with addressable rings, matched to the front intake.',
    sizeMm: 120,
    airflowCfm: 62,
    hasRgb: true,
    dimensionsMm: { width: 120, height: 120, depth: 25 },
    specs: [
      { label: 'Size', value: '120 mm' },
      { label: 'Quantity', value: '3 fans' },
      { label: 'Airflow', value: '62 CFM' },
      { label: 'Lighting', value: 'Addressable RGB' },
    ],
  },
  {
    id: 'fan-storm-120',
    category: 'fan',
    brand: 'AERO',
    name: 'Storm 120 High-Airflow Trio',
    price: 79,
    variant: 'fan-120-storm',
    blurb:
      'Static-pressure blades tuned for mesh-front intakes; louder, but it moves a lot more air.',
    sizeMm: 120,
    airflowCfm: 94,
    hasRgb: false,
    dimensionsMm: { width: 120, height: 120, depth: 30 },
    specs: [
      { label: 'Size', value: '120 mm' },
      { label: 'Quantity', value: '3 fans' },
      { label: 'Airflow', value: '94 CFM' },
      { label: 'Lighting', value: 'None' },
    ],
  },
  {
    id: 'fan-silent-120',
    category: 'fan',
    brand: 'AERO',
    name: 'Silent 120 Trio',
    price: 59,
    variant: 'fan-120-silent',
    blurb:
      'Low-noise 120 mm fans with fluid-dynamic bearings for a near-silent studio build.',
    sizeMm: 120,
    airflowCfm: 42,
    hasRgb: false,
    dimensionsMm: { width: 120, height: 120, depth: 25 },
    specs: [
      { label: 'Size', value: '120 mm' },
      { label: 'Quantity', value: '3 fans' },
      { label: 'Airflow', value: '42 CFM' },
      { label: 'Noise', value: '18 dB(A)' },
    ],
  },
]

/** Default build: a complete, fully compatible AM5 machine. */
export const DEFAULT_SLOTS: Slots = {
  case: 'case-vector-m1',
  motherboard: 'mb-nova-x670e',
  cpu: 'cpu-zenith-9-7950x',
  gpu: 'gpu-titan-4080-phantom',
  ram: 'ram-vortex-ddr5-32-rgb',
  cooling: 'cool-air-t6',
  storage: 'ssd-fury-2tb',
  psu: 'psu-volt-750g',
  fan: 'fan-aero-argb-120',
}

export const PRODUCTS_BY_ID: Record<string, Product> = Object.fromEntries(
  PRODUCTS.map((product) => [product.id, product]),
)

export const PRODUCTS_BY_CATEGORY = CATEGORY_ORDER.reduce(
  (grouped, category) => {
    grouped[category] = PRODUCTS.filter(
      (product) => product.category === category,
    )
    return grouped
  },
  {} as Record<CategoryId, Product[]>,
)

export function getProduct(id: string | null | undefined): Product | null {
  if (!id) return null
  return PRODUCTS_BY_ID[id] ?? null
}

/**
 * Reads the product filling a slot, narrowed to that slot's category. Stale or
 * cross-category ids (possible from persisted storage or a bug) read as empty
 * rather than crashing the scene.
 */
export function getSlotProduct<C extends CategoryId>(
  slots: Slots,
  category: C,
): ProductOf<C> | null {
  const product = getProduct(slots[category])
  if (!product || product.category !== category) return null
  return product as ProductOf<C>
}

export function isProductOfCategory<C extends CategoryId>(
  id: string,
  category: C,
): boolean {
  const product = getProduct(id)
  return product?.category === category
}

/**
 * Model name without the brand prefix, for printed labels where the brand is the
 * headline ("TITAN" / "RTX-4080 Phantom"). Catalogue data is the only source.
 */
export function productModelName(product: {
  brand: string
  name: string
}): string {
  const escaped = product.brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const model = product.name.replace(new RegExp(`^${escaped}\\s*`, 'i'), '').trim()
  return model.length > 0 ? model : product.name
}
