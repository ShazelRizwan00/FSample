import { FRONT_FAN_Y, FRONT_FAN_Z, REAR_FAN } from '../mounts'
import { Fan } from './Fan'
import type { FanProduct } from '@/lib/types'

/**
 * Case fan set: three front intake fans plus one rear exhaust. The catalogue's
 * fan entry covers the whole trio, so each fan product changes blade pitch, RPM
 * and whether the ARGB diffusers are lit.
 */
export function CaseFans({ product }: { product: FanProduct }) {
  const isHighAirflow = product.airflowCfm >= 80
  const isSilent = product.airflowCfm <= 45
  const bladeCount = isHighAirflow ? 11 : 9
  const spin = isHighAirflow ? 3.4 : isSilent ? 1.1 : 2.2
  const thickness = isHighAirflow ? 3 : 2.5

  return (
    <group>
      {FRONT_FAN_Y.map((y, index) => (
        <group key={y} position={[0, y, FRONT_FAN_Z]}>
          <Fan
            size={12}
            thickness={thickness}
            bladeCount={bladeCount}
            spin={index % 2 === 0 ? spin : -spin}
            rgb={product.hasRgb}
          />
        </group>
      ))}

      <group position={[0, REAR_FAN.y, REAR_FAN.z]}>
        <Fan
          size={12}
          thickness={thickness}
          bladeCount={bladeCount}
          spin={-spin}
          rgb={product.hasRgb}
        />
      </group>
    </group>
  )
}
