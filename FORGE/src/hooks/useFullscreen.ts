import { useCallback, useEffect, useState } from 'react'

/**
 * Fullscreen control with a live state that also follows the browser's own
 * escape handling, so the button never lies about the current mode.
 */
export function useFullscreen(): {
  isFullscreen: boolean
  toggle: () => Promise<void>
  supported: boolean
} {
  const supported =
    typeof document !== 'undefined' &&
    Boolean(document.documentElement.requestFullscreen)

  const [isFullscreen, setIsFullscreen] = useState(
    () => typeof document !== 'undefined' && Boolean(document.fullscreenElement),
  )

  useEffect(() => {
    const handleChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      // Browsers may refuse fullscreen (permissions, embedded contexts); the
      // button simply stays in its current state.
    }
  }, [])

  return { isFullscreen, toggle, supported }
}
