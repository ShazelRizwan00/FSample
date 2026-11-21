import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { TopNav } from '@/components/layout/TopNav'
import { DEFAULT_SLOTS } from '@/lib/catalog'
import {
  DEFAULT_APPEARANCE,
  DEFAULT_BUILD_NAME,
  STORAGE_KEY,
  useBuildStore,
} from '@/stores/useBuildStore'

/**
 * Whole-build actions: saving confirms and persists, resetting asks first and
 * restores the reference build, the name is editable, and fullscreen calls the
 * real browser API.
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

function renderNav() {
  return render(
    <TooltipProvider>
      <TopNav
        leftOpen
        rightOpen
        onToggleLeft={() => {}}
        onToggleRight={() => {}}
      />
      <Toaster />
    </TooltipProvider>,
  )
}

beforeEach(resetStore)
afterEach(cleanup)

describe('top navigation', () => {
  it('saves the build, confirms with a toast and persists it', async () => {
    const user = userEvent.setup()
    renderNav()

    expect(screen.getByText('· not saved yet')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Save build' }))

    expect(useBuildStore.getState().lastSavedAt).not.toBeNull()
    expect(await screen.findByText('Build saved')).toBeTruthy()
    expect(localStorage.getItem(STORAGE_KEY)).toContain('gpu-titan-4080-phantom')
  })

  it('asks before resetting and then restores the reference build', async () => {
    const user = userEvent.setup()
    useBuildStore.getState().equip('gpu', 'gpu-titan-4090-colossus')
    renderNav()

    await user.click(screen.getByRole('button', { name: 'Reset build' }))

    // The confirmation explains the consequence before anything changes.
    expect(screen.getByText('Reset this build?')).toBeTruthy()
    expect(useBuildStore.getState().slots.gpu).toBe('gpu-titan-4090-colossus')

    await user.click(screen.getByRole('button', { name: 'Reset to reference' }))

    expect(useBuildStore.getState().slots).toEqual(DEFAULT_SLOTS)
    expect(await screen.findByText('Build reset')).toBeTruthy()
  })

  it('renames the build inline', async () => {
    const user = userEvent.setup()
    renderNav()

    await user.click(screen.getByRole('button', { name: 'Edit build name' }))
    const input = screen.getByRole('textbox', { name: 'Build name' })

    await user.clear(input)
    await user.type(input, 'STUDIO RIG 02{Enter}')

    expect(useBuildStore.getState().buildName).toBe('STUDIO RIG 02')
    expect(screen.queryByRole('textbox', { name: 'Build name' })).toBeNull()
  })

  it('falls back to the reference name when the field is emptied', async () => {
    const user = userEvent.setup()
    renderNav()

    await user.click(screen.getByRole('button', { name: 'Edit build name' }))
    await user.clear(screen.getByRole('textbox', { name: 'Build name' }))
    await user.type(screen.getByRole('textbox', { name: 'Build name' }), '{Enter}')

    expect(useBuildStore.getState().buildName).toBe(DEFAULT_BUILD_NAME)
  })

  it('uses the browser fullscreen API', async () => {
    const user = userEvent.setup()
    const requestFullscreen = vi.fn().mockResolvedValue(undefined)
    const exitFullscreen = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    })
    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: exitFullscreen,
    })

    renderNav()
    await user.click(screen.getByRole('button', { name: 'Enter fullscreen' }))

    expect(requestFullscreen).toHaveBeenCalledTimes(1)
  })
})
