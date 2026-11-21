import { Layers, Lightbulb, Sparkles } from 'lucide-react'
import { cn } from 'cn'
import type { BackgroundPreset, RgbMode } from '@/lib/types'
import { BACKGROUND_THEMES } from '@/three/appearance'
import { RGB_COLOR_PRESETS, useBuildStore } from '@/stores/useBuildStore'

const RGB_MODES: Array<{ value: RgbMode; label: string }> = [
  { value: 'off', label: 'Off' },
  { value: 'static', label: 'Static' },
  { value: 'rainbow', label: 'Rainbow' },
]

const BACKGROUND_ORDER: BackgroundPreset[] = ['studio', 'void', 'grid']

/**
 * Studio appearance controls: RGB behaviour and colour, scene light level and the
 * environment theme. Every control writes straight to the build store, which the
 * canvas animation rig reads back.
 */
export function AppearancePanel() {
  const appearance = useBuildStore((state) => state.appearance)
  const setRgbMode = useBuildStore((state) => state.setRgbMode)
  const setRgbColor = useBuildStore((state) => state.setRgbColor)
  const setRgbIntensity = useBuildStore((state) => state.setRgbIntensity)
  const setLightIntensity = useBuildStore((state) => state.setLightIntensity)
  const setBackground = useBuildStore((state) => state.setBackground)

  return (
    <section
      aria-label="Studio appearance"
      className="flex h-full w-full flex-col overflow-y-auto"
    >
      <div className="border-b border-border/50 px-3.5 py-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-forge-cyan/80" />
            <span className="micro">RGB lighting</span>
          </span>
        </div>

        <div
          role="group"
          aria-label="RGB mode"
          className="mt-2.5 flex rounded-md border border-border/60 p-0.5"
        >
          {RGB_MODES.map((mode) => {
            const active = appearance.rgbMode === mode.value
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => setRgbMode(mode.value)}
                aria-pressed={active}
                className={cn(
                  'flex-1 rounded px-2 py-1 text-[11px] font-medium transition-colors',
                  active
                    ? 'bg-forge-cyan/15 text-forge-cyan'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {mode.label}
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex items-center gap-2">
          {RGB_COLOR_PRESETS.map((preset) => {
            const active = appearance.rgbColor === preset.hex
            return (
              <button
                key={preset.hex}
                type="button"
                aria-label={`${preset.name} lighting`}
                aria-pressed={active}
                onClick={() => {
                  setRgbColor(preset.hex)
                  if (appearance.rgbMode !== 'rainbow') setRgbMode('static')
                }}
                className={cn(
                  'size-6 rounded-full border-2 transition-transform',
                  active
                    ? 'scale-110 border-foreground/80'
                    : 'border-transparent hover:scale-105',
                )}
                style={{
                  backgroundColor: preset.hex,
                  boxShadow: `0 0 12px -2px ${preset.hex}`,
                }}
              />
            )
          })}
          <span className="ml-auto numeric text-[10px] text-muted-foreground/70">
            {appearance.rgbMode === 'rainbow' ? 'animated' : appearance.rgbColor}
          </span>
        </div>

        <RangeControl
          label="RGB intensity"
          value={appearance.rgbIntensity}
          min={0}
          max={1}
          step={0.01}
          display={`${Math.round(appearance.rgbIntensity * 100)}%`}
          disabled={appearance.rgbMode === 'off'}
          onChange={setRgbIntensity}
        />
      </div>

      <div className="border-b border-border/50 px-3.5 py-3">
        <span className="flex items-center gap-1.5">
          <Lightbulb className="size-3.5 text-forge-cyan/80" />
          <span className="micro">Scene</span>
        </span>

        <RangeControl
          label="Light intensity"
          value={appearance.lightIntensity}
          min={0.2}
          max={2}
          step={0.05}
          display={`${Math.round(appearance.lightIntensity * 100)}%`}
          onChange={setLightIntensity}
        />

        <div className="mt-3">
          <span className="text-[11px] text-muted-foreground">Environment</span>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {BACKGROUND_ORDER.map((preset) => {
              const theme = BACKGROUND_THEMES[preset]
              const active = appearance.background === preset
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBackground(preset)}
                  aria-pressed={active}
                  aria-label={`${theme.label} environment`}
                  className={cn(
                    'rounded-lg border p-1.5 text-left transition-colors',
                    active
                      ? 'border-forge-cyan/50 bg-forge-cyan/[0.07]'
                      : 'border-border/50 hover:border-border hover:bg-muted/40',
                  )}
                >
                  <span
                    className="block h-7 w-full rounded"
                    style={{
                      background: `linear-gradient(160deg, ${theme.background}, ${theme.floor})`,
                    }}
                  />
                  <span className="mt-1.5 block text-[10px] font-medium tracking-wide text-foreground/85">
                    {theme.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 px-3.5 py-3">
        <Layers className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/60" />
        <p className="text-[10px] leading-relaxed text-muted-foreground/80">
          Lighting values are illustrative. Exploded view and the glass panel are
          toggled from the viewport controls.
        </p>
      </div>
    </section>
  )
}

/** Native range input: fully accessible and keyboard-operable by construction. */
function RangeControl({
  label,
  value,
  min,
  max,
  step,
  display,
  disabled,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  disabled?: boolean
  onChange: (value: number) => void
}) {
  return (
    <label className={cn('mt-3 block', disabled && 'opacity-50')}>
      <span className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="numeric text-[11px] text-foreground/90">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-1.5 w-full cursor-pointer accent-forge-cyan disabled:cursor-not-allowed"
      />
    </label>
  )
}
