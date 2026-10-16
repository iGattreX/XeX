import { useState, type FocusEvent, type PointerEvent } from 'react'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, CodeBracketIcon, Square2StackIcon } from '@heroicons/react/24/outline'
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

  return (
    <section aria-label="Code for the control you are using" className="sticky bottom-3 z-20 overflow-hidden rounded-xl border border-accent-line bg-surface shadow-lg">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-center gap-2 bg-brand-700 px-4 py-1 text-xs font-medium text-white hover:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
      >
        <CodeBracketIcon className="h-4 w-4" />
        {open ? 'Hide code' : 'Expand for code'}
        {open ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronUpIcon className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="p-3">
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
      )}
    </section>
  )
}
