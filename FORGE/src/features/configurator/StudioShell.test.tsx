import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DEFAULT_SLOTS } from '@/lib/catalog'
import {
  DEFAULT_APPEARANCE,
  DEFAULT_BUILD_NAME,
  useBuildStore,
} from '@/stores/useBuildStore'
import { StudioShell } from './StudioShell'

// The shell test covers layout and rail behaviour; WebGL belongs to the studio.
vi.mock('@/three/Studio', () => ({
  Studio: () => <div data-testid="studio" />,
}))

afterEach(cleanup)

beforeEach(() => {
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
})

function renderShell() {
  return render(
    <TooltipProvider>
      <StudioShell />
    </TooltipProvider>,
  )
}

function rail(container: HTMLElement, side: 'left' | 'right') {
  const element = container.querySelector(`[data-side="${side}"]`)
  if (!element) throw new Error(`${side} rail did not render`)
  return element as HTMLElement
}

/** Pretend the viewport is narrower than the `lg` breakpoint. */
function useCompactViewport() {
  const original = window.matchMedia
  window.matchMedia = ((query: string) => ({
    matches: query.includes('max-width: 1023px'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
  return () => {
    window.matchMedia = original
  }
}

describe('StudioShell', () => {
  it('renders the stage between both rails', () => {
    const { container } = renderShell()

    expect(screen.getByLabelText('3D viewport')).toBeTruthy()
    expect(screen.getByLabelText('Component browser')).toBeTruthy()
    expect(screen.getByLabelText('Component inspector')).toBeTruthy()
    expect(screen.getByText(DEFAULT_BUILD_NAME)).toBeTruthy()
    expect(rail(container, 'left')).toBeTruthy()
    expect(rail(container, 'right')).toBeTruthy()
  })

  it('collapses and restores each rail from the top nav', async () => {
    const user = userEvent.setup()
    const { container } = renderShell()
    const leftRail = rail(container, 'left')
    const rightRail = rail(container, 'right')

    expect(leftRail.getAttribute('data-open')).toBe('true')
    expect(rightRail.getAttribute('data-open')).toBe('true')

    await user.click(screen.getByRole('button', { name: 'Hide components' }))
    expect(leftRail.getAttribute('data-open')).toBe('false')
    expect(leftRail.style.width).toBe('0px')
    expect(rightRail.getAttribute('data-open')).toBe('true')

    await user.click(screen.getByRole('button', { name: 'Show components' }))
    expect(leftRail.getAttribute('data-open')).toBe('true')
    expect(leftRail.style.width).toBe('300px')

    await user.click(screen.getByRole('button', { name: 'Hide inspector' }))
    expect(rightRail.getAttribute('data-open')).toBe('false')
    expect(rightRail.style.width).toBe('0px')
  })

  it('swaps the rails for overlay drawers on compact viewports', async () => {
    const user = userEvent.setup()
    const restore = useCompactViewport()

    try {
      useBuildStore.setState({ leftRailOpen: false, rightRailOpen: false })
      const { container } = renderShell()

      // No inline rails: the stage owns the full width.
      expect(container.querySelector('[data-side]')).toBeNull()

      const leftDrawer = container.querySelector(
        '[data-drawer="left"]',
      ) as HTMLElement | null
      const rightDrawer = container.querySelector(
        '[data-drawer="right"]',
      ) as HTMLElement | null
      expect(leftDrawer).toBeTruthy()
      expect(rightDrawer).toBeTruthy()
      expect(leftDrawer?.getAttribute('data-open')).toBe('false')
      expect(leftDrawer?.className).toContain('-translate-x-full')

      await user.click(screen.getByRole('button', { name: 'Show components' }))

      expect(leftDrawer?.getAttribute('data-open')).toBe('true')
      expect(leftDrawer?.className).toContain('translate-x-0')
      expect(rightDrawer?.getAttribute('data-open')).toBe('false')
    } finally {
      restore()
    }
  })
})
