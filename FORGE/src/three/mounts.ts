import { Vector3 } from 'three'
import type { CategoryId } from '@/lib/types'

/**
 * Scene layout — the single source of truth for where hardware lives.
 *
 * Scale: 1 scene unit = 1 centimetre. The chassis interior is 21 × 46 × 46 units
 * (W × H × D), so an ATX board is 30.5 deep × 24.4 tall, a 336 mm GPU is 33.6
 * long and a 165 mm cooler projects 16.5 units toward the glass panel.
 *
 * Axes: +X is the motherboard tray side, −X is the tempered-glass side, +Y is
 * up, −Z is the front of the case and +Z is the rear I/O.
 */

export const CASE = {
  /** Interior extents. */
  width: 21,
  height: 46,
  depth: 46,
  wall: 0.35,
  /** Outer faces derived from the interior — used for panels and glass. */
  minX: -10.5,
  maxX: 10.5,
  minY: 0,
  maxY: 46,
  minZ: -23,
  maxZ: 23,
  /** The hinged glass panel sits just outside the interior on −X. */
  glassX: -10.9,
  trayX: 7.4,
  footHeight: 0.8,
} as const

/** Motherboard reference frame: rear-bottom corner of the PCB. */
export const BOARD_FRAME = {
  x: CASE.trayX,
  y: 10,
  z: 22.6,
} as const

export const BOARD_SIZE = {
  ATX: { length: 30.5, height: 24.4 },
  mATX: { length: 24.4, height: 24.4 },
} as const

export const PCB_THICKNESS = 0.16

/** Board-local layout (y up from the board's bottom edge, −z toward the front). */
export const BOARD_LAYOUT = {
  socket: { y: 18, z: -9.8 },
  socketFrame: 7.4,
  ihs: 4.2,
  vrm: { y: 22.4, z: -16.6, depth: 2.2, width: 6.4 },
  vrmRear: { y: 13.4, z: -2.4, width: 3.2, height: 8 },
  ioShroud: { y: 9.5, z: -1.5, height: 19, depth: 2.6 },
  pcie: { y: 8, z: -1.6, length: 8.9 },
  pcieSecondary: { y: 2.6, z: -1.6, length: 8.9 },
  chipset: { y: 1.2, z: -9.5, size: 4.6 },
  m2: { y: 0.6, z: -6.5, length: 8.4 },
  atx24: { y: 21, z: -6.2 },
} as const

/** DIMM slot centres, board-local z. Spacing matches a real 4-slot board. */
export const DIMM_SLOT_Z = [-17.4, -16, -14.6, -13.2] as const

export const DIMM = {
  length: 13.3,
  height: 4.2,
  thickness: 0.85,
  centerY: 16.5,
} as const

export const FRONT_FAN_Y = [14, 26, 38] as const
export const FRONT_FAN_Z = -21.4
export const REAR_FAN = { y: 34, z: 21.2 } as const

export const PSU_BAY = {
  y: 0.9,
  z: 14.6,
  width: 15,
  height: 8.6,
} as const

export const COOLER = {
  /** Air tower footprint in the board plane. */
  finHeight: 12,
  finDepth: 5.0,
  /** Projection from the board toward the glass, i.e. cooler "height". */
  maxProjection: 16.5,
  fanThickness: 2.5,
} as const

export const AIO = {
  radiatorHeight: 39.7,
  radiatorWidth: 12,
  radiatorThickness: 2.7,
  y: 42.2,
  z: 0,
} as const

export const GPU_Z = {
  /** Bracket plane, i.e. the rear face of the card. */
  rear: 21.4,
  /** Card body starts hanging below the PCIe slot. */
  top: 17.4,
} as const

export const LEGEND = {
  gpuSlotY: BOARD_FRAME.y + BOARD_LAYOUT.pcie.y,
} as const

/** Slot mount transforms, in world space. */
export type Mount = {
  position: [number, number, number]
  rotation?: [number, number, number]
}

export const MOUNTS: Record<CategoryId, Mount> = {
  case: { position: [0, 0, 0] },
  motherboard: {
    position: [BOARD_FRAME.x, BOARD_FRAME.y, BOARD_FRAME.z],
  },
  cpu: {
    position: [
      BOARD_FRAME.x - PCB_THICKNESS - 0.35,
      BOARD_FRAME.y + BOARD_LAYOUT.socket.y,
      BOARD_FRAME.z + BOARD_LAYOUT.socket.z,
    ],
  },
  ram: {
    position: [
      BOARD_FRAME.x - PCB_THICKNESS,
      BOARD_FRAME.y + DIMM.centerY,
      BOARD_FRAME.z,
    ],
  },
  cooling: {
    position: [
      BOARD_FRAME.x - PCB_THICKNESS,
      BOARD_FRAME.y + BOARD_LAYOUT.socket.y,
      BOARD_FRAME.z + BOARD_LAYOUT.socket.z,
    ],
  },
  gpu: {
    position: [0.4, 12, GPU_Z.rear],
  },
  psu: {
    position: [0, PSU_BAY.y + PSU_BAY.height / 2, PSU_BAY.z],
  },
  storage: {
    position: [
      BOARD_FRAME.x - PCB_THICKNESS - 0.3,
      BOARD_FRAME.y + BOARD_LAYOUT.m2.y,
      BOARD_FRAME.z + BOARD_LAYOUT.m2.z,
    ],
  },
  fan: {
    position: [0, FRONT_FAN_Y[1], FRONT_FAN_Z],
  },
}

/**
 * Exploded-view direction per slot. Applied as `base + offset * progress` so the
 * exploded state composes with replacement transitions instead of fighting them.
 */
export const EXPLODE_OFFSETS: Record<CategoryId, [number, number, number]> = {
  case: [0, 0, 0],
  motherboard: [-4.5, 0, 0],
  cpu: [-13, 0, 0],
  ram: [-9, 0, 0],
  cooling: [-15, 0, 0],
  gpu: [-19, 5, -3],
  psu: [-8, -1.5, 0],
  storage: [-7, 0, 0],
  fan: [0, 0, -14],
}

/** Camera framing for the whole rig and for part focus. */
export const CAMERA = {
  home: new Vector3(-72, 38, -62),
  target: new Vector3(0, 22, 0),
  minDistance: 22,
  maxDistance: 130,
} as const

/** Converts a product's millimetre dimension to scene units. */
export function mm(value: number): number {
  return value / 10
}
