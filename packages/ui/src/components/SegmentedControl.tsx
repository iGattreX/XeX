import clsx from 'clsx'
import { radioGroupKeyDown } from './keyboard'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Accessible name for the group, e.g. "Row density". */
  label: string
  className?: string
}

/** Mutually exclusive options shown side by side, with the active one raised. Arrow keys move the choice. */
export function SegmentedControl<T extends string>({ options, value, onChange, label, className }: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={radioGroupKeyDown}
      className={clsx('inline-flex rounded-lg bg-gray-100 p-0.5', className)}
    >
      {options.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={clsx(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
              selected ? 'bg-surface text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
