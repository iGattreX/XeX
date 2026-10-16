import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  hint?: string
  error?: string
}

/** A native checkbox with a label, themed with the brand colour. Works controlled or uncontrolled. */
export function Checkbox({ label, hint, error, className, id, ...rest }: CheckboxProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const noteId = `${inputId}-note`
  const note = error ?? hint
  return (
    <div className={className}>
      <label htmlFor={inputId} className={clsx('flex items-center gap-2 text-sm text-gray-700', rest.disabled && 'cursor-not-allowed opacity-50')}>
        <input
          {...rest}
          id={inputId}
          type="checkbox"
          aria-invalid={!!error || undefined}
          aria-describedby={note ? noteId : undefined}
          className="h-4 w-4 rounded accent-brand-600"
        />
        {label}
      </label>
      {note && (
        <p id={noteId} className={clsx('mt-1 pl-6 text-xs', error ? 'text-danger-ink' : 'text-gray-500')}>
          {note}
        </p>
      )}
    </div>
  )
}
