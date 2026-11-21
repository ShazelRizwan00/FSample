import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { JSX } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'

/**
 * Procedural decal pipeline for hardware labels.
 *
 * Renders crisp printed labels for PC components (PSU ratings, GPU branding,
 * motherboard headers) onto dynamic 2D HTML canvases at runtime without external
 * image assets, font files, or network requests.
 *
 * Degradation path:
 * In headless, SSR, or test environments (such as jsdom), where HTMLCanvasElement
 * has no 2D rendering context by default, `createLabelTexture` safely returns `null`
 * instead of throwing. Mounted `<Label />` components observe this null texture
 * and cleanly render nothing (`null`), preventing test and layout crashes.
 */

export type LabelDescriptor = {
  text: string
  sub?: string
  accent?: string
  tone?: 'light' | 'dark'
  width: number
  height: number
}

export type LabelTextureOptions = {
  createContext?: () => CanvasRenderingContext2D | null
}

const textureCache = new Map<string, CanvasTexture>()
const fontListeners = new Set<() => void>()
let fontReadyInitiated = false
let fontVersion = 0

function subscribeFont(listener: () => void): () => void {
  fontListeners.add(listener)
  return () => {
    fontListeners.delete(listener)
  }
}

function getFontSnapshot(): number {
  return fontVersion
}

function initFontReload(): void {
  if (fontReadyInitiated) return
  fontReadyInitiated = true
  if (typeof document === 'undefined' || !document.fonts?.ready) return

  void document.fonts.ready
    .then(() => {
      clearLabelCache()
      fontVersion++
      for (const listener of fontListeners) listener()
    })
    .catch(() => {
      // Font loading failure; keep fallback rendering
    })
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, spacing: string): void {
  try {
    if ('letterSpacing' in ctx) ctx.letterSpacing = spacing
  } catch {
    // Ignored if unsupported or not writable
  }
}

function serializeDescriptor(d: LabelDescriptor): string {
  return JSON.stringify({
    text: d.text,
    sub: d.sub ?? '',
    accent: d.accent ?? '',
    tone: d.tone ?? 'light',
    width: d.width,
    height: d.height,
  })
}

export function createLabelTexture(
  descriptor: LabelDescriptor,
  options?: LabelTextureOptions,
): CanvasTexture | null {
  const safeWidth = descriptor.width > 0 ? descriptor.width : 1
  const width = 512
  const height = Math.max(64, Math.round((512 * descriptor.height) / safeWidth))

  let ctx: CanvasRenderingContext2D | null = null
  try {
    if (options?.createContext) {
      ctx = options.createContext()
    } else if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas')
      ctx = canvas.getContext('2d')
    }
  } catch {
    return null
  }

  if (!ctx || !ctx.canvas) return null

  const canvas = ctx.canvas as HTMLCanvasElement
  canvas.width = width
  canvas.height = height
  ctx.clearRect(0, 0, width, height)

  const isDark = descriptor.tone === 'dark'
  const textColor = isDark ? '#0b0f14' : '#eef4fb'
  const subColor = isDark ? 'rgba(11, 15, 20, 0.62)' : 'rgba(238, 244, 251, 0.62)'

  const x = width * 0.08
  const hasSub = Boolean(descriptor.sub)
  const titleY = hasSub ? height / 2 - 22 : height / 2

  ctx.font = '600 62px "Space Grotesk", system-ui, sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = textColor
  setLetterSpacing(ctx, '1px')
  ctx.fillText(descriptor.text, x, titleY)

  if (descriptor.sub) {
    const subY = height / 2 + 24
    ctx.font = '500 34px "JetBrains Mono", ui-monospace, monospace'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = subColor
    setLetterSpacing(ctx, '0.5px')
    ctx.fillText(descriptor.sub, x, subY)
  }

  if (descriptor.accent) {
    ctx.fillStyle = descriptor.accent
    const barHeight = 6
    const barY = height - barHeight
    ctx.fillRect(x, barY, width - 2 * x, barHeight)
  }

  try {
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = 4
    texture.needsUpdate = true
    return texture
  } catch {
    return null
  }
}

export function getLabelTexture(descriptor: LabelDescriptor): CanvasTexture | null {
  const key = serializeDescriptor(descriptor)
  const cached = textureCache.get(key)
  if (cached) return cached

  const texture = createLabelTexture(descriptor)
  if (texture) textureCache.set(key, texture)
  return texture
}

export function clearLabelCache(): void {
  for (const texture of textureCache.values()) texture.dispose()
  textureCache.clear()
}

export function Label(props: {
  descriptor: LabelDescriptor
  position?: [number, number, number]
  rotation?: [number, number, number]
}): JSX.Element | null {
  const { descriptor, position, rotation } = props
  const { text, sub, accent, tone, width, height } = descriptor

  useEffect(() => {
    initFontReload()
  }, [])

  const version = useSyncExternalStore(subscribeFont, getFontSnapshot, () => 0)

  const texture = useMemo(() => {
    void version
    return getLabelTexture({ text, sub, accent, tone, width, height })
  }, [text, sub, accent, tone, width, height, version])

  if (!texture) return null

  return (
    <mesh position={position} rotation={rotation} raycast={() => undefined}>
      <planeGeometry args={[descriptor.width, descriptor.height]} />
      <meshStandardMaterial
        map={texture}
        emissiveMap={texture}
        emissive="#ffffff"
        emissiveIntensity={0.06}
        transparent
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-2}
        roughness={0.6}
        metalness={0.1}
      />
    </mesh>
  )
}
