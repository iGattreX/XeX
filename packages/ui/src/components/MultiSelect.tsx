import { useMemo } from 'react'
import { Combobox } from './Combobox'

export interface MultiSelectOption {
  value: string
  label: string
  /** Optional count shown beside the label. */
  count?: number
}

export interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  /** Text shown (and used as the accessible name) when nothing is selected, e.g. "All roles". */
  label: string
  className?: string
}

/** Dropdown with a checkbox per option; a `Combobox` in multiple mode. Esc / outside click / tabbing away closes it. */
export function MultiSelect({ options, value, onChange, label, className }: MultiSelectProps) {
  const items = useMemo(() => options.map((o) => ({ value: o.value, label: o.label, meta: o.count })), [options])
  const names = options.filter((o) => value.includes(o.value)).map((o) => o.label)
  return (
    <Combobox
      multiple
      className={className}
      options={items}
      value={value}
      onChange={onChange}
      placeholder={label}
      aria-label={names.length ? `${label}: ${names.join(', ')}` : label}
      searchPlaceholder={`Search ${label.toLowerCase()}…`}
    />
  )
}
