import { useCallback, useState } from 'react'

/**
 * Whether the user has collapsed the sidebar, remembered in localStorage.
 * Give each app its own key (like ThemeProvider's `storagePrefix`), e.g. `my-app-nav-collapsed`.
 */
export function useSidebarCollapsed(storageKey = 'xex-nav-collapsed'): [collapsed: boolean, setCollapsed: (value: boolean) => void] {
  const [collapsed, setState] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === '1'
    } catch {
      return false
    }
  })

  const setCollapsed = useCallback(
    (value: boolean) => {
      setState(value)
      try {
        localStorage.setItem(storageKey, value ? '1' : '0')
      } catch {
        /* storage unavailable: still works for this session */
      }
    },
    [storageKey],
  )

  return [collapsed, setCollapsed]
}
