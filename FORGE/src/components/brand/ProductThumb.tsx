import type { Product } from '@/lib/types'

/**
 * Product thumbnails as inline SVG.
 *
 * These are drawn from the same data the 3D parts use — fan count, module count,
 * cooler type, drive length — so the catalogue thumbnail always matches the
 * object the browser is about to install. No image assets, crisp at any density.
 */

const SURFACE = 'fill-white/[0.07] stroke-white/25'
const SOLID = 'fill-white/20 stroke-white/40'
const ACCENT = 'fill-forge-cyan/70 stroke-forge-cyan'
const DARK = 'fill-black/50 stroke-white/20'

export function ProductThumb({ product }: { product: Product }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden
      className="size-11 shrink-0 rounded-md border border-border/60 bg-[#0b0f14] p-1"
    >
      {renderShape(product)}
    </svg>
  )
}

function renderShape(product: Product) {
  switch (product.category) {
    case 'case':
      return (
        <g>
          <rect x="13" y="6" width="22" height="36" rx="2" className={SURFACE} />
          <rect x="16" y="9" width="16" height="30" rx="1" className={DARK} />
          <path d="M32 8v32" className="stroke-forge-cyan/70" strokeWidth="1.4" />
          {[13, 21, 29].map((y) => (
            <circle key={y} cx="24" cy={y + 4} r="3.1" className="stroke-white/30" fill="none" />
          ))}
        </g>
      )

    case 'motherboard':
      return (
        <g>
          <rect x="7" y="7" width="34" height="34" rx="1.5" className={SURFACE} />
          <rect x="12" y="12" width="10" height="10" rx="1" className={SOLID} />
          {[26, 29, 32, 35].map((x) => (
            <rect key={x} x={x} y="12" width="1.6" height="16" className={ACCENT} />
          ))}
          <rect x="12" y="27" width="18" height="2.2" className={SOLID} />
          <rect x="12" y="32" width="12" height="2.2" className={SOLID} />
        </g>
      )

    case 'cpu':
      return (
        <g>
          <rect x="11" y="11" width="26" height="26" rx="3" className={SOLID} />
          <rect x="16" y="16" width="16" height="16" rx="2" className={ACCENT} />
          <path d="M11 17h-3M11 24h-3M11 31h-3M37 17h3M37 24h3M37 31h3" className="stroke-white/30" strokeWidth="1.2" />
        </g>
      )

    case 'gpu': {
      const fans = product.fanCount
      return (
        <g>
          <rect x="5" y="16" width="38" height="16" rx="2" className={SURFACE} />
          <rect x="5" y="13" width="38" height="3" rx="1" className={SOLID} />
          {Array.from({ length: fans }).map((_, index) => {
            const spacing = 38 / fans
            const cx = 5 + spacing * (index + 0.5)
            return (
              <g key={index}>
                <circle cx={cx} cy="24" r={Math.min(spacing / 2 - 1.4, 6)} className="stroke-white/35" fill="none" />
                <circle cx={cx} cy="24" r="1.3" className={ACCENT} />
              </g>
            )
          })}
          <path d="M5 20h-3v8h3" className={DARK} />
        </g>
      )
    }

    case 'ram':
      return (
        <g>
          {Array.from({ length: product.modules }).map((_, index) => {
            const x = 8 + index * (32 / Math.max(product.modules, 1) )
            const width = Math.max(4, 32 / product.modules - 2)
            return (
              <g key={index}>
                <rect x={x} y="12" width={width} height="24" rx="1.5" className={SOLID} />
                {product.hasRgb ? (
                  <rect x={x} y="12" width={width} height="4" className={ACCENT} />
                ) : null}
              </g>
            )
          })}
        </g>
      )

    case 'cooling':
      return product.kind === 'air' ? (
        <g>
          <rect x="14" y="8" width="20" height="32" rx="2" className={SURFACE} />
          {Array.from({ length: 7 }).map((_, index) => (
            <path
              key={index}
              d={`M16 ${11 + index * 4}h16`}
              className="stroke-white/25"
              strokeWidth="1.1"
            />
          ))}
          <circle cx="24" cy="24" r="6.4" className="stroke-forge-cyan/70" fill="none" strokeWidth="1.3" />
          <circle cx="24" cy="24" r="1.8" className={ACCENT} />
        </g>
      ) : (
        <g>
          <rect x="8" y="18" width="32" height="7" rx="1.5" className={SOLID} />
          {[12, 24, 36].map((x) => (
            <circle key={x} cx={x} cy="30" r="4.4" className="stroke-forge-cyan/60" fill="none" strokeWidth="1.2" />
          ))}
          <circle cx="24" cy="12" r="5" className={SOLID} />
          <circle cx="24" cy="12" r="2.4" className={ACCENT} />
        </g>
      )

    case 'storage':
      return (
        <g>
          <rect x="9" y="20" width="30" height="9" rx="1.5" className={SURFACE} />
          {[15, 22, 29].map((x) => (
            <rect key={x} x={x} y="22" width="5" height="5" rx="0.7" className={SOLID} />
          ))}
          <rect x="36" y="22" width="2.4" height="5" className={ACCENT} />
        </g>
      )

    case 'psu':
      return (
        <g>
          <rect x="6" y="15" width="36" height="18" rx="2" className={SURFACE} />
          <circle cx="17" cy="24" r="6.4" className="stroke-white/30" fill="none" />
          <path d="M17 18l-3 6h3l-1.5 6 5-7h-3z" className={ACCENT} />
          {[28, 33, 38].map((x) => (
            <rect key={x} x={x} y="20" width="3" height="8" rx="1" className={SOLID} />
          ))}
        </g>
      )

    case 'fan':
      return (
        <g>
          <rect x="8" y="8" width="32" height="32" rx="4" className={SURFACE} />
          <circle cx="24" cy="24" r="12" className="stroke-white/25" fill="none" />
          {Array.from({ length: 7 }).map((_, index) => {
            const angle = (index / 7) * Math.PI * 2
            return (
              <path
                key={index}
                d={`M24 24 L${24 + Math.cos(angle) * 11} ${24 + Math.sin(angle) * 11}`}
                className="stroke-white/35"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            )
          })}
          <circle cx="24" cy="24" r="4" className={ACCENT} />
        </g>
      )

    default:
      return <rect x="12" y="12" width="24" height="24" className={DARK} />
  }
}
