import { useEffect, useId, useRef, type ReactNode } from 'react'
import clsx from 'clsx'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { focusablesIn, useDialogFocus } from './keyboard'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

const sizes: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  footer?: ReactNode
  size?: ModalSize
  /** Accessible name when there is no visible `title`. */
  ariaLabel?: string
  children: ReactNode
}

export function Modal({ open, onClose, title, footer, size = 'md', ariaLabel, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  // Scroll lock, focus in/out, Tab trap. Body content is preferred over the header's close button.
  const trapTab = useDialogFocus(open, panelRef, {
    initialFocus: () => bodyRef.current && focusablesIn(bodyRef.current)[0],
  })

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
        tabIndex={-1}
        onKeyDown={trapTab}
        className={clsx('relative flex max-h-[90vh] w-full flex-col rounded-2xl bg-surface shadow-2xl focus:outline-none', sizes[size])}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 id={titleId} className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}
        <div ref={bodyRef} className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
        {footer && <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}
