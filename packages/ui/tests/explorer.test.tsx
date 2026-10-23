import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CONTROLS, type PropDef, type Values } from '../../../apps/docs/src/explorer/controls'
import { applies, attributesFor, codeText } from '../../../apps/docs/src/explorer/Explorer'
import { SNIPPETS } from '../../../apps/docs/src/code/snippets'
import * as ui from '../src'

// The "Explore options" section lists each control's options by hand. These tests keep that list
// honest: every option must really change what the control renders, so a renamed or removed
// option cannot linger as a dead knob.

const initial = (props: PropDef[]): Values => Object.fromEntries(props.map((p) => [p.name, p.initial ?? p.default]))
/** The starting values with the option's own conditions met (e.g. `padded` needs a plain Section). */
const forOption = (props: PropDef[], p: PropDef): Values => ({ ...initial(props), ...p.when })

/** A value different from the current one, for the option. */
function other(p: PropDef, current: string | number | boolean): string | number | boolean {
  switch (p.kind) {
    case 'select':
      return p.options.find((o) => o !== current)!
    case 'boolean':
      return !current
    case 'number':
      return current === p.max ? p.min : p.max
    default:
      return `${current}zzz`
  }
}

// Behaviour-only options that leave no trace in the markup of a freshly rendered control.
const BEHAVIOUR_ONLY = new Set(['Tabs.activation', 'Combobox.searchable', 'Combobox.picked', 'Combobox.items', 'Tooltip.delay']) // only visible while the list is open, or demo state

describe('options explorer', () => {
  it('only lists controls the library exports and that have a code snippet', () => {
    for (const c of CONTROLS) {
      expect(Object.keys(ui), c.id).toContain(c.id)
      expect(SNIPPETS[c.id], c.id).toBeDefined()
    }
  })

  for (const c of CONTROLS) {
    describe(c.id, () => {
      it('renders with its starting options', () => {
        const { container } = render(<>{c.render(initial(c.props), () => {})}</>)
        expect(container.innerHTML).not.toBe('')
      })

      for (const p of c.props) {
        if (BEHAVIOUR_ONLY.has(`${c.id}.${p.name}`)) continue
        it(`option "${p.name}" changes what is rendered`, () => {
          const base = forOption(c.props, p)
          const before = render(<>{c.render(base, () => {})}</>).container.innerHTML
          const after = render(<>{c.render({ ...base, [p.name]: other(p, base[p.name]) }, () => {})}</>).container.innerHTML
          expect(after).not.toBe(before)
        })
      }

      it('produces code that names the control and lists a changed option', () => {
        const base = initial(c.props)
        const attrOption = c.props.find((p) => p.name !== c.children && applies(p, base))!
        const changed = { ...base, [attrOption.name]: other(attrOption, base[attrOption.name]) }
        expect(attributesFor(c, changed).join(' ')).toContain(attrOption.name)
        const code = codeText(c, changed)!
        // the example may import what it uses too (a Tooltip's example is a Button)
        expect(code).toMatch(new RegExp(String.raw`import \{[^}]*\b${c.id}\b[^}]*\} from '@xex/ui'`))
        expect(code).toContain(`<${c.id}`)
      })
    })
  }

  it('lists options at the component default only when they must be shown (always)', () => {
    const bar = CONTROLS.find((c) => c.id === 'ProgressBar')!
    expect(attributesFor(bar, initial(bar.props))).toContain('value={60}') // the starting value, always shown
    const button = CONTROLS.find((c) => c.id === 'Button')!
    expect(attributesFor(button, { ...initial(button.props), variant: 'primary', size: 'md' })).toEqual([]) // defaults omitted
  })

  it('only offers `padded` for a plain Section, and leaves it out of the code for a card', () => {
    const section = CONTROLS.find((c) => c.id === 'Section')!
    const padded = section.props.find((p) => p.name === 'padded')!
    expect(applies(padded, { ...initial(section.props), appearance: 'card' })).toBe(false)
    expect(applies(padded, { ...initial(section.props), appearance: 'plain' })).toBe(true)
    expect(attributesFor(section, { ...initial(section.props), appearance: 'card', padded: false })).not.toContain('padded={false}')
    expect(attributesFor(section, { ...initial(section.props), appearance: 'plain', padded: false })).toContain('padded={false}')
  })
})
