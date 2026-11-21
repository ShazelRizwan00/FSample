import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DEFAULT_SLOTS } from '@/lib/catalog'
import {
  DEFAULT_APPEARANCE,
  DEFAULT_BUILD_NAME,
  useBuildStore,
} from '@/stores/useBuildStore'
import { selectTotalPrice } from '@/stores/selectors'
import { ComponentBrowser } from './ComponentBrowser'
import { InspectorPanel } from './InspectorPanel'

/**
 * Browser and inspector wiring: equipping from the list must change the slot and
 * the price, removal must empty the slot, and the inspector must show the real
 * product data for whatever is selected.
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

describe('component browser', () => {
  it('equips a product, marks it equipped and reprices the build', async () => {
    const user = userEvent.setup()
    renderUi(<ComponentBrowser />)

    const before = selectTotalPrice(useBuildStore.getState())
    const option = screen.getByRole('button', { name: 'Equip Titan RTX-4070 Mini' })

    await user.click(option)

    const state = useBuildStore.getState()
    expect(state.slots.gpu).toBe('gpu-titan-4070-mini')
    expect(selectTotalPrice(state)).toBe(before - 1099 + 649)
    expect(within(option).getByText('Equipped')).toBeTruthy()

    const previous = screen.getByRole('button', { name: 'Equip Titan RTX-4080 Phantom' })
    expect(within(previous).queryByText('Equipped')).toBeNull()
  })

  it('opens the section for a component selected in 3D', async () => {
    renderUi(<ComponentBrowser />)

    // GPUs are open by default.
    expect(screen.getByRole('button', { name: 'Equip Titan RTX-4070 Mini' })).toBeTruthy()

    await act(async () => {
      useBuildStore.getState().selectCategory('ram')
    })

    expect(
      screen.getByRole('button', { name: 'Equip Vortex DDR5-6000 32GB' }),
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Equip Titan RTX-4070 Mini' })).toBeNull()
  })

  it('removes the equipped part from its slot', async () => {
    const user = userEvent.setup()
    renderUi(<ComponentBrowser />)

    await user.click(screen.getByRole('button', { name: 'Remove' }))

    // The open section is GPUs by default.
    expect(useBuildStore.getState().slots.gpu).toBeNull()
    expect(selectTotalPrice(useBuildStore.getState())).toBe(2641 - 1099)
  })
})

describe('inspector', () => {
  it('shows the selected component with specs, dimensions and price', () => {
    useBuildStore.getState().selectCategory('gpu')
    renderUi(<InspectorPanel />)

    expect(screen.getByText('Titan RTX-4080 Phantom')).toBeTruthy()
    expect(screen.getByText('TITAN')).toBeTruthy()
    expect(screen.getByText('$1,099')).toBeTruthy()
    expect(screen.getByText('336 × 140 × 62 mm')).toBeTruthy()
    expect(screen.getByText('16 GB')).toBeTruthy()
  })

  it('removes the selected component and returns to the empty state', async () => {
    const user = userEvent.setup()
    useBuildStore.getState().selectCategory('gpu')
    renderUi(<InspectorPanel />)

    await user.click(
      screen.getByRole('button', { name: 'Remove graphics card' }),
    )

    expect(useBuildStore.getState().slots.gpu).toBeNull()
    expect(useBuildStore.getState().selectedCategory).toBeNull()
    expect(screen.getByText('No component selected')).toBeTruthy()
  })

  it('opens the browser on the same slot when replacing', async () => {
    const user = userEvent.setup()
    useBuildStore.getState().selectCategory('cpu')
    useBuildStore.getState().setLeftRailOpen(false)
    renderUi(<InspectorPanel />)

    await user.click(screen.getByRole('button', { name: 'Replace cpu' }))

    const state = useBuildStore.getState()
    expect(state.leftRailOpen).toBe(true)
    expect(state.revealRequest?.category).toBe('cpu')
  })
})
