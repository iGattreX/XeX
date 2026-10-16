import { describe, expect, it } from 'vitest'
import * as ui from '../src'
import { NON_COMPONENT_SNIPPETS, SNIPPETS, codeFor } from '../../../apps/docs/src/code/snippets'

// The Controls page shows code for each control. A component the library exports without a snippet
// there would be undiscoverable, so every exported component must have one.
describe('code snippets', () => {
  const components = Object.entries(ui)
    .filter(([name, value]) => /^[A-Z][a-z]/.test(name) && typeof value === 'function')
    .map(([name]) => name)

  it('covers every component the library exports', () => {
    const missing = components.filter((n) => !SNIPPETS[n])
    expect(missing).toEqual([])
  })

  it('does not describe components that do not exist', () => {
    const extra = Object.keys(SNIPPETS).filter((n) => n !== 'FontPicker' && !NON_COMPONENT_SNIPPETS.includes(n) && !components.includes(n))
    expect(extra).toEqual([])
  })

  it('reflects the props the control is showing, and imports what it uses', () => {
    const code = codeFor('Button', 'variant="danger" size="lg"')!
    expect(code).toContain(`<Button variant="danger" size="lg">`)
    expect(code).toContain(`import { Button } from '@xex/ui'`)
    expect(codeFor('Modal')).toContain('Button') // the example uses a Button in its footer
    expect(codeFor('FontPicker')).toContain(`from '@xex/ui/font-picker'`)
    expect(codeFor('Nope')).toBeNull()
  })

  it('uses the label the control shows and imports the icons it uses', () => {
    const code = codeFor('Button', 'variant="danger" icon={<TrashIcon className="h-4 w-4" />}', 'Remove')!
    expect(code).toContain('>Remove</Button>')
    expect(code).toContain(`import { TrashIcon } from '@heroicons/react/24/outline'`)
    expect(codeFor('Button', 'disabled', 'Disabled')).toContain('<Button disabled>Disabled</Button>')
  })

  it('shows form controls with the props the demo uses, one per line when long', () => {
    const email = codeFor('Input', ['label="Email"', 'type="email"'].join(String.fromCharCode(10)))!
    expect(email).toContain('<Input label="Email" type="email" />')
    const select = codeFor('Select', ['label="Region"', 'defaultValue="eu"', "options={[{ value: 'us', label: 'United States' }]}"].join(String.fromCharCode(10)))!
    expect(select).toContain('<Select' + String.fromCharCode(10) + '  label="Region"')
  })
})
