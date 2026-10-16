import type { ReactNode } from 'react'
import clsx from 'clsx'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Text beside the switch. Without one, pass `aria-label`. */
  label?: ReactNode
  'aria-label'?: string
  disabled?: boolean
  className?: string
  id?: string
}

/** An on/off toggle for settings that apply immediately. Space or Enter flips it. */
export function Switch({ checked, onChange, label, disabled, className, id, 'aria-label': ariaLabel }: SwitchProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx('group flex items-center gap-3 text-sm text-gray-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50', className)}
    >
      <span
        className={clsx(
          // the button is what receives focus, so the ring is driven from it via `group`
          'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors group-focus-visible:ring-2 group-focus-visible:ring-brand-400 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-surface',
          checked ? 'bg-brand-600' : 'bg-gray-300',
        )}
      >
        <span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </span>
      {label}
    </button>
  )
}
