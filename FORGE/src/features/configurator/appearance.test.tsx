import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DEFAULT_SLOTS } from '@/lib/catalog'
import {
  DEFAULT_APPEARANCE,
  DEFAULT_BUILD_NAME,
  useBuildStore,
} from '@/stores/useBuildStore'
import { AppearancePanel } from './AppearancePanel'
import { RightRail } from './RightRail'
import { ViewportControls } from './ViewportControls'

/**
 * Studio controls: the appearance panel and viewport toggles must write real
 * state that the canvas reads back — RGB mode and colour, light level,
 * environment theme, glass panel and exploded view.
 */

function resetStore() {
  localStorage.clear()
  useBuildStore.setState({
    buildName: DEFAULT_BUILD_NAME,
    slots: { ...DEFAULT_SLOTS },
    selectedCategory: null,
    hoveredCategory: null,
    panelOpen: false,
    exploded: false,
    appearance: { ...DEFAULT_APPEARANCE },
    leftRailOpen: true,
    rightRailOpen: true,
    lastSavedAt: null,
    cameraResetToken: 0,
    focusRequest: null,
    revealRequest: null,
  })
}

function renderUi(node: React.ReactNode) {
  return render(<TooltipProvider>{node}</TooltipProvider>)
}

beforeEach(resetStore)
afterEach(cleanup)

describe('appearance panel', () => {
  it('switches RGB mode and colour', async () => {
    const user = userEvent.setup()
    renderUi(<AppearancePanel />)

    await user.click(screen.getByRole('button', { name: 'Rainbow' }))
    expect(useBuildStore.getState().appearance.rgbMode).toBe('rainbow')

    await user.click(screen.getByRole('button', { name: 'Amber lighting' }))
    const appearance = useBuildStore.getState().appearance
    expect(appearance.rgbColor).toBe('#f5a524')
    // Picking a colour while rainbow is running turns the effect off first.
    expect(appearance.rgbMode).toBe('rainbow')

    await user.click(screen.getByRole('button', { name: 'Off' }))
    expect(useBuildStore.getState().appearance.rgbMode).toBe('off')
  })

  it('turns a static colour on when a swatch is picked from off', async () => {
    const user = userEvent.setup()
    useBuildStore.getState().setRgbMode('off')
    renderUi(<AppearancePanel />)

    await user.click(screen.getByRole('button', { name: 'Rose lighting' }))

    const appearance = useBuildStore.getState().appearance
    expect(appearance.rgbColor).toBe('#f43f5e')
    expect(appearance.rgbMode).toBe('static')
  })

  it('drives RGB and light intensity from the ranges', () => {
    renderUi(<AppearancePanel />)

    fireEvent.change(screen.getByLabelText('RGB intensity'), {
      target: { value: '0.35' },
    })
    fireEvent.change(screen.getByLabelText('Light intensity'), {
      target: { value: '1.6' },
    })

    const appearance = useBuildStore.getState().appearance
    expect(appearance.rgbIntensity).toBeCloseTo(0.35, 5)
    expect(appearance.lightIntensity).toBeCloseTo(1.6, 5)
  })

  it('swaps the environment theme', async () => {
    const user = userEvent.setup()
    renderUi(<AppearancePanel />)

    await user.click(screen.getByRole('button', { name: 'Hangar environment' }))

    expect(useBuildStore.getState().appearance.background).toBe('grid')
  })
})

describe('right rail', () => {
  it('opens on the component tab and switches to studio', async () => {
    const user = userEvent.setup()
    useBuildStore.getState().selectCategory('gpu')
    renderUi(<RightRail />)

    expect(screen.getByLabelText('Component inspector')).toBeTruthy()
    expect(screen.queryByLabelText('Studio appearance')).toBeNull()

    await user.click(screen.getByRole('tab', { name: 'Studio' }))

    expect(screen.getByLabelText('Studio appearance')).toBeTruthy()
    expect(screen.queryByLabelText('Component inspector')).toBeNull()
  })
})

describe('viewport toggles', () => {
  it('opens and closes the glass side panel', async () => {
    const user = userEvent.setup()
    renderUi(<ViewportControls />)

    await user.click(screen.getByRole('button', { name: 'Open side panel' }))
    expect(useBuildStore.getState().panelOpen).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Close side panel' }))
    expect(useBuildStore.getState().panelOpen).toBe(false)
  })

  it('toggles the exploded view', async () => {
    const user = userEvent.setup()
    renderUi(<ViewportControls />)

    const toggle = screen.getByRole('button', { name: 'Exploded view' })
    expect(toggle.getAttribute('aria-pressed')).toBe('false')

    await user.click(toggle)

    expect(useBuildStore.getState().exploded).toBe(true)
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
  })

  it('keeps focus disabled until something is selected', () => {
    const view = renderUi(<ViewportControls />)

    const focus = screen.getByRole('button', {
      name: 'Focus selected component',
    }) as HTMLButtonElement
    expect(focus.disabled).toBe(true)

    useBuildStore.getState().selectCategory('gpu')
    view.rerender(
      <TooltipProvider>
        <ViewportControls />
      </TooltipProvider>,
    )

    expect(
      (screen.getByRole('button', { name: 'Focus selected component' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false)
  })
})
