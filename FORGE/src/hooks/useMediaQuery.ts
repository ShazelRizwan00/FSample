import { useCallback, useSyncExternalStore } from 'react'

/**
 * Media query subscription without effects: `useSyncExternalStore` re-reads the
 * query on every change notification, which keeps the first render correct (no
 * layout flash on a small screen).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  )

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/** Tailwind's `lg` breakpoint: below this the rails become overlay drawers. */
export const COMPACT_QUERY = '(max-width: 1023px)'

export function useIsCompactLayout(): boolean {
  return useMediaQuery(COMPACT_QUERY)
}
