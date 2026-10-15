import { useId, type SelectHTMLAttributes } from 'react'
import clsx from 'clsx'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

export interface SelectOption {
  value: string | number
  label: string
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  options: SelectOption[]
  /** Renders a blank first option with this text. */
  placeholder?: string
  error?: string
  hint?: string
}

export function Select({ label, options, placeholder, error, hint, className, id, disabled, ...rest }: SelectProps) {
  const autoId = useId()
  const selectId = id ?? autoId
  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          disabled={disabled}
          aria-invalid={!!error || undefined}
          className={clsx(
            'w-full appearance-none rounded-lg border bg-surface px-3 py-2 pr-9 text-sm text-gray-900',
            'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400',
            'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
            error ? 'border-danger' : 'border-gray-300',
          )}
          {...rest}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
      </div>
      {error ? <p className="mt-1 text-xs text-danger-ink">{error}</p> : hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  )
}
