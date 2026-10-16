import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
}

/** A single native radio with a label. Use `RadioGroup` for a set of choices. */
export function Radio({ label, className, id, ...rest }: RadioProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <label htmlFor={inputId} className={clsx('flex items-center gap-2 text-sm text-gray-700', rest.disabled && 'cursor-not-allowed opacity-50', className)}>
      <input {...rest} id={inputId} type="radio" className="h-4 w-4 accent-brand-600" />
      {label}
    </label>
  )
}

export interface RadioOption {
  value: string
  label: ReactNode
  disabled?: boolean
}

export interface RadioGroupProps {
  /** Group label, read by screen readers. */
  label: string
  options: RadioOption[]
  value: string
  onChange: (value: string) => void
  /** Shared by the radios; generated when omitted. */
  name?: string
  direction?: 'row' | 'column'
  error?: string
  hint?: string
  className?: string
}

/**
 * One choice from a few, all visible. Built on native radios, so the group is one Tab stop and the
 * arrow keys move and select, as users expect.
 */
export function RadioGroup({ label, options, value, onChange, name, direction = 'column', error, hint, className }: RadioGroupProps) {
  const autoName = useId()
  const noteId = `${autoName}-note`
  const note = error ?? hint
  return (
    <fieldset className={className} aria-describedby={note ? noteId : undefined}>
      <legend className="mb-2 text-sm font-medium text-gray-700">{label}</legend>
      <div className={clsx('flex gap-x-5 gap-y-2', direction === 'column' && 'flex-col')}>
        {options.map((o) => (
          <Radio key={o.value} name={name ?? autoName} value={o.value} label={o.label} checked={value === o.value} disabled={o.disabled} onChange={() => onChange(o.value)} />
        ))}
      </div>
      {note && (
        <p id={noteId} className={clsx('mt-1 text-xs', error ? 'text-danger-ink' : 'text-gray-500')}>
          {note}
        </p>
      )}
    </fieldset>
  )
}
