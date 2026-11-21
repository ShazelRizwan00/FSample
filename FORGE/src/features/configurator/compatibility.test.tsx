import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '@/components/ui/tooltip'
import { BottomBar } from '@/components/layout/BottomBar'
import { DEFAULT_SLOTS } from '@/lib/catalog'
import {
  DEFAULT_APPEARANCE,
  DEFAULT_BUILD_NAME,
  useBuildStore,
} from '@/stores/useBuildStore'
import { InspectorPanel } from './InspectorPanel'

/**
 * Compatibility surfacing: the bottom bar must report the live total, part count
 * and verdict, its popover must explain every issue, and the inspector must show
 * the checks that concern the selected component — all labelled as demo validation.
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

describe('bottom bar', () => {
  it('reports the live total, part count and a compatible verdict', () => {
    renderUi(<BottomBar />)

    expect(screen.getByTestId('build-total').textContent).toBe('$2,641')
    expect(screen.getByText('9')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Compatibility: compatible' }),
    ).toBeTruthy()
  })

  it('explains every issue behind an incompatible verdict', async () => {
    const user = userEvent.setup()
    renderUi(<BottomBar />)

    await act(async () => {
      useBuildStore.getState().equip('cpu', 'cpu-apex-i9-14900k')
    })

    // The LGA1700 chip on an AM5 board, its cooler rating and PSU headroom.
    const verdict = screen.getByRole('button', {
      name: 'Compatibility: incompatible',
    })
    expect(verdict.textContent).toContain('3')
    expect(screen.getByTestId('build-total').textContent).toBe('$2,681')

    await user.click(verdict)

    expect(screen.getByText('CPU socket mismatch')).toBeTruthy()
    expect(screen.getByText('Cooler is under-rated for this CPU')).toBeTruthy()
    expect(screen.getByText(/Demo validation only/)).toBeTruthy()
  })

  it('downgrades to a warning when a part is missing', async () => {
    const user = userEvent.setup()
    renderUi(<BottomBar />)

    await act(async () => {
      useBuildStore.getState().clearSlot('gpu')
    })

    const verdict = screen.getByRole('button', {
      name: 'Compatibility: warnings',
    })
    await user.click(verdict)

    expect(screen.getByText('Graphics card missing')).toBeTruthy()
    expect(screen.getByTestId('build-total').textContent).toBe('$1,542')
  })

  it('states plainly when every check passes', async () => {
    const user = userEvent.setup()
    renderUi(<BottomBar />)

    await user.click(
      screen.getByRole('button', { name: 'Compatibility: compatible' }),
    )

    expect(
      within(screen.getByLabelText('Compatibility issues')).getByText(
        'Every demo check passes for this configuration.',
      ),
    ).toBeTruthy()
  })
})

describe('inspector compatibility', () => {
  it('shows the checks that concern the selected component', async () => {
    renderUi(<InspectorPanel />)

    await act(async () => {
      useBuildStore.getState().selectCategory('cpu')
      useBuildStore.getState().equip('cpu', 'cpu-apex-i9-14900k')
    })

    const section = screen.getByLabelText('Compatibility')
    expect(within(section).getByText('CPU socket mismatch')).toBeTruthy()
    expect(within(section).getByText('demo validation')).toBeTruthy()
  })

  it('reports a clean part when nothing concerns it', async () => {
    renderUi(<InspectorPanel />)

    await act(async () => {
      useBuildStore.getState().selectCategory('gpu')
    })

    const section = screen.getByLabelText('Compatibility')
    expect(
      within(section).getByText('No issues flagged for this part'),
    ).toBeTruthy()
  })
})
