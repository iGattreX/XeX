import { useLayoutEffect, useState, type FocusEvent, type PointerEvent } from 'react'
import { CheckIcon, ChevronDownIcon, CodeBracketIcon, Square2StackIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { codeFor } from './snippets'

interface Target {
  name: string
  props?: string
}

const OPEN_KEY = 'xex-docs-code-open'

const readOpen = () => {
  try {
    return localStorage.getItem(OPEN_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Tracks which demo control the user last used. Mark a control (or a group) with `data-code="Name"`,
 * and optionally `data-code-props='variant="danger"'` to reflect what it currently shows; spread
 * `handlers` on a wrapper around the page. Pressing or focusing inside a marked element selects it.
 * `show(name)` selects one directly, for controls with no inline demo.
 */
export function useCodeDock() {
  const [target, setTarget] = useState<Target | null>(null)

  const pick = (e: FocusEvent | PointerEvent) => {
    const el = (e.target as Element).closest?.('[data-code]') as HTMLElement | null | undefined
    if (!el) return
    const next = { name: el.dataset.code!, props: el.dataset.codeProps }
    setTarget((t) => (t && t.name === next.name && t.props === next.props ? t : next))
  }

  return {
    target,
    show: (name: string) => setTarget({ name }),
    handlers: { onFocusCapture: pick, onPointerDownCapture: pick },
  }
}

/** A thin theme-coloured bar that expands to the code for the control the user last used. */
export function CodeDock({ target }: { target: Target | null }) {
  const [open, setOpen] = useState(readOpen)
  const [copied, setCopied] = useState(false)

  const toggle = () => {
    const next = !open
    setOpen(next)
    try {
      localStorage.setItem(OPEN_KEY, next ? '1' : '0')
    } catch {
      /* storage unavailable: works for this session */
    }
  }

  const code = target ? codeFor(target.name, target.props) : null

  const copy = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked: the text is still selectable */
    }
  }

  // Sits just under the sticky page header, whatever height that has at the current width.
  const [top, setTop] = useState(0)
  useLayoutEffect(() => {
    const header = document.querySelector('header')
    if (!header) return
    const measure = () => setTop(header.getBoundingClientRect().height)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(header)
    return () => ro.disconnect()
  }, [])

  return (
    <section aria-label="Code for the control you are using" style={{ top }} className="sticky z-20 -mb-5 -mt-4 bg-canvas pt-1">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="code-dock-panel"
        className="group block w-full rounded text-[11px] font-medium leading-none text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        <span className="flex items-center gap-3 opacity-40 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="h-px flex-1 bg-current" aria-hidden="true" />
          <span className="flex items-center gap-1">
            <CodeBracketIcon className="h-3.5 w-3.5" />
            {open ? 'Hide code' : 'Expand for code'}
            <ChevronDownIcon className={clsx('h-3 w-3 transition-transform duration-300 motion-reduce:transition-none', open && 'rotate-180')} />
          </span>
          <span className="h-px flex-1 bg-current" aria-hidden="true" />
        </span>
      </button>

      {/* Grows from 0 to its natural height (and back), then a second line closes the section.
          `invisible` once collapsed keeps it out of the tab order and the accessibility tree. */}
      <div
        id="code-dock-panel"
        className={clsx(
          'grid transition-[grid-template-rows,visibility] duration-300 ease-out motion-reduce:transition-none',
          open ? 'visible grid-rows-[1fr]' : 'invisible grid-rows-[0fr]',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="px-1 py-3">
            {code && target ? (
              <>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">{target.name}</p>
                  <button
                    type="button"
                    onClick={copy}
                    aria-label={`Copy ${target.name} code`}
                    className="flex items-center gap-1 rounded-lg p-1.5 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                  >
                    {copied ? <CheckIcon className="h-4 w-4 text-success" /> : <Square2StackIcon className="h-4 w-4" />}
                    <span aria-live="polite">{copied ? 'Copied' : ''}</span>
                  </button>
                </div>
                <pre tabIndex={0} aria-label={`${target.name} code`} className="max-h-56 overflow-auto rounded-lg bg-gray-100 p-3 text-xs leading-relaxed text-gray-900">
                  <code>{code}</code>
                </pre>
              </>
            ) : (
              <p className="text-sm text-gray-600">Use any control on this page and its code appears here.</p>
            )}
          </div>
          <div className="h-px bg-gray-500 opacity-40" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
