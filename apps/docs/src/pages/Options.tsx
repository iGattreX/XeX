import { Section, type PageSection } from '@xex/ui'
import { Explorer } from '../explorer/Explorer'

export const OPTION_SECTIONS: PageSection[] = [{ id: 'explorer', label: 'Explorer' }]

export function Options() {
  return (
    <Section
      id="explorer"
      title="Explore a control"
      description="Pick a control, change its options and watch it, and the code to produce it, update. The Controls page shows each control as it is used."
    >
      <Explorer />
    </Section>
  )
}
