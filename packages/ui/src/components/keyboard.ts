import { useEffect, type KeyboardEvent, type RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export const focusablesIn = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length > 0)

/**
 * Keyboard handling for a `role="radiogroup"` container: arrows (and Home/End)
 * move focus AND selection, wrapping at the ends. Pair with roving tabindex on
 * the items (`tabIndex={selected ? 0 : -1}`) so the group is a single Tab stop.
 */
export function radioGroupKeyDown(e: KeyboardEvent<HTMLElement>) {
  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End']
  if (!keys.includes(e.key)) return
  const radios = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]:not([disabled])'))
  const i = radios.findIndex((r) => r === document.activeElement || r.contains(document.activeElement))
  if (i < 0) return
  e.preventDefault()
  const last = radios.length - 1
  const next =
    e.key === 'Home' ? 0 : e.key === 'End' ? last : e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (i === last ? 0 : i + 1) : i === 0 ? last : i - 1
  radios[next].focus()
  radios[next].click()
}

/**
 * Dialog focus management: scroll lock, move focus in on open, restore it to the
 * opener on close, and a Tab trap. Spread the returned handler on the panel.
 */
export function useDialogFocus(
  open: boolean,
  panelRef: RefObject<HTMLElement | null>,
  options: { initialFocus?: () => HTMLElement | null | undefined; lockScroll?: boolean } = {},
) {
  const { initialFocus, lockScroll = true } = options

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const { overflow, paddingRight } = document.body.style
    if (lockScroll) {
      const scrollbar = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`
    }

    const panel = panelRef.current
    if (panel) {
      const target =
        panel.querySelector<HTMLElement>('[data-autofocus]') ?? initialFocus?.() ?? focusablesIn(panel)[0] ?? panel
      target.focus()
    }

    return () => {
      if (lockScroll) {
        document.body.style.overflow = overflow
        document.body.style.paddingRight = paddingRight
      }
      if (opener && document.contains(opener)) opener.focus()
    }
    // initialFocus is read once, at open time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (e: KeyboardEvent<HTMLElement>) => {
    const panel = panelRef.current
    if (e.key !== 'Tab' || !panel) return
    const items = focusablesIn(panel)
    if (items.length === 0) {
      e.preventDefault()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (e.shiftKey && (active === first || active === panel)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }
}
