import { useId, type TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

/** Multi-line text field, styled and labelled like `Input`. */
export function Textarea({ label, error, hint, className, id, rows = 3, ...rest }: TextareaProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const noteId = `${fieldId}-note`
  const note = error ?? hint
  return (
    <div className={className}>
      {label && (
        <label htmlFor={fieldId} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        {...rest}
        id={fieldId}
        rows={rows}
        aria-invalid={!!error || undefined}
        aria-describedby={note ? noteId : undefined}
        className={clsx(
          'w-full rounded-lg border bg-surface px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400',
          'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
          error ? 'border-danger' : 'border-gray-300',
        )}
      />
      {note && (
        <p id={noteId} className={clsx('mt-1 text-xs', error ? 'text-danger-ink' : 'text-gray-500')}>
          {note}
        </p>
      )}
    </div>
  )
}
