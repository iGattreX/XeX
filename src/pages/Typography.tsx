import { Section, type PageSection } from '../components/layout/Section'
import { FontPicker } from '../components/FontPicker'
import { useTheme } from '../context/ThemeContext'

export const TYPE_SECTIONS: PageSection[] = [
  { id: 'font', label: 'Font' },
  { id: 'scale', label: 'Type scale' },
  { id: 'weights', label: 'Weights' },
  { id: 'prose', label: 'Prose & code' },
]

const SCALE: [string, string][] = [
  ['text-4xl', 'text-4xl font-bold'],
  ['text-3xl', 'text-3xl font-bold'],
  ['text-2xl', 'text-2xl font-semibold'],
  ['text-xl', 'text-xl font-semibold'],
  ['text-lg', 'text-lg font-medium'],
  ['text-base', 'text-base'],
  ['text-sm', 'text-sm'],
  ['text-xs', 'text-xs'],
]

export function Typography() {
  const { font } = useTheme()
  return (
    <>
      <Section id="font" title="Font" description={`Active: ${font.family}. Applies to the whole app and is shared with the Controls page.`}>
        <FontPicker />
        <p className="mt-4 text-sm text-gray-600">The quick brown fox jumps over the lazy dog — 0123456789</p>
      </Section>

      <Section id="scale" title="Type scale" description={`Rendered in ${font.family}. Pick one above.`}>
        <div className="divide-y divide-gray-100">
          {SCALE.map(([name, cls]) => (
            <div key={name} className="flex items-baseline justify-between gap-4 py-3">
              <span className={`${cls} truncate text-gray-900`}>The quick brown fox</span>
              <code className="shrink-0 font-mono text-xs text-gray-400">{name}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section id="weights" title="Weights">
        <div className="grid gap-2 sm:grid-cols-2">
          {(['font-normal', 'font-medium', 'font-semibold', 'font-bold'] as const).map((w) => (
            <p key={w} className={`${w} text-lg text-gray-900`}>
              Sphinx of black quartz <span className="font-mono text-xs font-normal text-gray-400">{w}</span>
            </p>
          ))}
        </div>
      </Section>

      <Section id="prose" title="Prose & code">
        <div className="max-w-prose space-y-3 text-sm leading-relaxed text-gray-600">
          <p>
            XeX components inherit <code className="rounded bg-gray-100 px-1 font-mono text-xs">font-sans</code>, which resolves to the
            font chosen in the theme controls. Headings, labels and table cells all follow it.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-gray-100 p-3 font-mono text-xs text-gray-700">{`<Button variant="primary" size="md">Save</Button>`}</pre>
        </div>
      </Section>
    </>
  )
}
