import { getSlotProduct } from '@/lib/catalog'
import { useBuildStore } from '@/stores/useBuildStore'
import { MOUNTS } from './mounts'
import { PartGroup } from './PartGroup'
import { useRigInteraction } from './interaction'
import { CaseChassis } from './parts/CaseChassis'
import { CaseFans } from './parts/CaseFans'
import { Cooler } from './parts/Cooler'
import { Cpu } from './parts/Cpu'
import { GpuCard } from './parts/GpuCard'
import { Motherboard } from './parts/Motherboard'
import { PsuUnit } from './parts/PsuUnit'
import { RamKit } from './parts/RamKit'
import { Storage } from './parts/Storage'
import { Wiring } from './parts/Wiring'

/**
 * The assembled rig. Every slot reads from the build store, so swapping a part
 * re-renders exactly one subtree — and the geometry that appears is the geometry
 * that product actually describes (fan count, module count, board size).
 *
 * Slot anchors stay mounted even when empty so a removal can play its exit
 * animation before the geometry is released.
 *
 * Pointer events are handled once here: hover, click-to-select and double-click
 * focus all resolve the hit mesh up to its slot.
 */
export function PcRig() {
  const slots = useBuildStore((state) => state.slots)
  const panelOpen = useBuildStore((state) => state.panelOpen)
  const interaction = useRigInteraction()

  const pcCase = getSlotProduct(slots, 'case')
  const motherboard = getSlotProduct(slots, 'motherboard')
  const cpu = getSlotProduct(slots, 'cpu')
  const gpu = getSlotProduct(slots, 'gpu')
  const ram = getSlotProduct(slots, 'ram')
  const cooling = getSlotProduct(slots, 'cooling')
  const psu = getSlotProduct(slots, 'psu')
  const storage = getSlotProduct(slots, 'storage')
  const fans = getSlotProduct(slots, 'fan')

  return (
    <group {...interaction}>
      <PartGroup category="case" productId={pcCase?.id ?? null}>
        {pcCase ? <CaseChassis glassOpen={panelOpen} /> : null}
      </PartGroup>

      <PartGroup
        category="motherboard"
        productId={motherboard?.id ?? null}
        position={MOUNTS.motherboard.position}
      >
        {motherboard ? <Motherboard product={motherboard} /> : null}
      </PartGroup>

      <PartGroup category="cpu" productId={cpu?.id ?? null} position={MOUNTS.cpu.position}>
        {cpu ? <Cpu product={cpu} /> : null}
      </PartGroup>

      <PartGroup category="ram" productId={ram?.id ?? null} position={MOUNTS.ram.position}>
        {ram ? <RamKit product={ram} /> : null}
      </PartGroup>

      <PartGroup
        category="cooling"
        productId={cooling?.id ?? null}
        position={MOUNTS.cooling.position}
      >
        {cooling ? <Cooler product={cooling} /> : null}
      </PartGroup>

      <PartGroup category="gpu" productId={gpu?.id ?? null} position={MOUNTS.gpu.position}>
        {gpu ? <GpuCard product={gpu} /> : null}
      </PartGroup>

      <PartGroup category="psu" productId={psu?.id ?? null} position={MOUNTS.psu.position}>
        {psu ? <PsuUnit product={psu} /> : null}
      </PartGroup>

      <PartGroup
        category="storage"
        productId={storage?.id ?? null}
        position={MOUNTS.storage.position}
      >
        {storage ? <Storage product={storage} /> : null}
      </PartGroup>

      <PartGroup category="fan" productId={fans?.id ?? null}>
        {fans ? <CaseFans product={fans} /> : null}
      </PartGroup>

      {/* Power harness: attached to the hardware, outside the slot registry. */}
      <Wiring motherboard={motherboard} gpu={gpu} psu={psu} />
    </group>
  )
}
