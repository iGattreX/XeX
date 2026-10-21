import { useState } from 'react'
import clsx from 'clsx'
import { CheckIcon, Square2StackIcon } from '@heroicons/react/24/outline'
import { Button, Input, Select, Switch } from '@xex/ui'
import { codeFor } from '../code/snippets'
import { CONTROLS, type ExplorerControl, type PropDef, type Values } from './controls'

/** Where the explorer starts for a control. */
const initialOf = (c: ExplorerControl): Values => Object.fromEntries(c.props.map((p) => [p.name, p.initial ?? p.default]))

/** Is the option applicable, given the others? (`padded` only means something for a plain Section.) */
export const applies = (p: PropDef, values: Values) => !p.when || Object.entries(p.when).every(([k, v]) => values[k] === v)

/** The attributes that differ from the defaults (text options are always listed when filled in). */
export function attributesFor(c: ExplorerControl, values: Values): string[] {
  const out: string[] = []
  for (const p of c.props) {
    if (p.name === c.children || p.hidden || !applies(p, values)) continue
    const v = values[p.name]
    const listed = p.always || v !== p.default
    if (p.kind === 'select' && listed) out.push(`${p.name}="${v}"`)
    else if (p.kind === 'boolean' && listed) out.push(v ? p.name : `${p.name}={false}`)
    else if (p.kind === 'number' && listed) out.push(`${p.name}={${v}}`)
    else if (p.kind === 'text' && v !== '') out.push(`${p.name}="${v}"`)
  }
  return out
}

/** The code for a control with the chosen options. */
export function codeText(c: ExplorerControl, values: Values): string | null {
  const generated = attributesFor(c, values)
  const list = c.codeProps ? c.codeProps(values, generated) : [...(c.codeBase ?? []), ...generated]
  return codeFor(c.id, list.join('\n'), c.children ? String(values[c.children]) : undefined)
}

function Field({ def, value, onChange }: { def: PropDef; value: string | number | boolean; onChange: (v: string | number | boolean) => void }) {
  switch (def.kind) {
    case 'select':
      return <Select label={def.name} value={String(value)} onChange={(e) => onChange(e.target.value)} options={def.options.map((o) => ({ value: o, label: o }))} />
    case 'boolean':
      return <Switch checked={value === true} onChange={onChange} label={def.name} />
    case 'number':
      return (
        <Input
          label={def.name}
          type="number"
          min={def.min}
          max={def.max}
          value={String(value)}
          onChange={(e) => onChange(Math.min(def.max, Math.max(def.min, Number(e.target.value) || 0)))}
        />
      )
    default:
      return <Input label={def.name} value={String(value)} onChange={(e) => onChange(e.target.value)} />
  }
}

/**
 * Pick a control, change its options and see it, and its code, update. The Controls page stays a
 * gallery; this is where one control's options are explored.
 */
export function Explorer() {
  const [id, setId] = useState(CONTROLS[0].id)
  const [chosen, setChosen] = useState<Record<string, Values>>({})
  const [copied, setCopied] = useState(false)

  const control = CONTROLS.find((c) => c.id === id)!
  const values: Values = { ...initialOf(control), ...chosen[id] }
  const set = (name: string, value: string | number | boolean) => setChosen((c) => ({ ...c, [id]: { ...initialOf(control), ...c[id], [name]: value } }))
  const changed = Object.entries(values).some(([k, v]) => v !== initialOf(control)[k])
  const code = codeText(control, values)

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
    <div data-explorer className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Select className="w-56" label="Control" value={id} onChange={(e) => setId(e.target.value)} options={CONTROLS.map((c) => ({ value: c.id, label: c.id }))} />
        {changed && (
          <Button variant="ghost" size="sm" onClick={() => setChosen(({ [id]: _drop, ...rest }) => rest)}>
            Reset options
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className={clsx('flex min-h-[12rem] min-w-0 items-center justify-center rounded-xl border border-dashed border-gray-300 p-6', control.previewClass)} data-testid="explorer-preview">
          {control.render(values, set)}
        </div>
        <div className="space-y-3" role="group" aria-label={`${control.id} options`}>
          {control.props.filter((def) => !def.hidden && applies(def, values)).map((def) => (
            <Field key={def.name} def={def} value={values[def.name]} onChange={(v) => set(def.name, v)} />
          ))}
        </div>
      </div>

      {code && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Code</p>
            <button
              type="button"
              onClick={copy}
              aria-label="Copy code"
              className="flex items-center gap-1 rounded-lg p-1.5 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              {copied ? <CheckIcon className="h-4 w-4 text-success" /> : <Square2StackIcon className="h-4 w-4" />}
              <span aria-live="polite">{copied ? 'Copied' : ''}</span>
            </button>
          </div>
          <pre tabIndex={0} aria-label={`${control.id} code`} className="max-h-64 overflow-auto rounded-lg bg-gray-100 p-3 text-xs leading-relaxed text-gray-900">
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  )
}
