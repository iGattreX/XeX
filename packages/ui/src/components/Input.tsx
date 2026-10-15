import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  /** Leading icon, absolutely positioned inside the field. */
  icon?: ReactNode
}

export function Input({ label, error, hint, icon, className, id, ...rest }: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-gray-400 [&>svg]:h-5 [&>svg]:w-5">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={!!error || undefined}
          className={clsx(
            'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
            icon && 'pl-9',
            error ? 'border-red-400' : 'border-gray-300',
          )}
          {...rest}
        />
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  )
}
