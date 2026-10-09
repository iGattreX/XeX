import { lazy, type ComponentType, type LazyExoticComponent, type SVGProps } from 'react'
import { AdjustmentsHorizontalIcon, DocumentTextIcon, PhotoIcon } from '@heroicons/react/24/outline'
import type { PageSection } from '../components/layout/Section'
import { Playground, SECTIONS } from './Playground'
import { Typography, TYPE_SECTIONS } from './Typography'

// The icon page pulls in every Heroicon, so it is split into its own chunk.
const Icons = lazy(() => import('./Icons'))

const ICON_SECTIONS: PageSection[] = [
  { id: 'guidelines', label: 'Guidelines' },
  { id: 'sizes', label: 'Sizes' },
  { id: 'browser', label: 'Icon browser' },
]

export interface PageDef {
  id: string
  /** Sidebar label. */
  label: string
  title: string
  subtitle: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  component: ComponentType | LazyExoticComponent<ComponentType>
  /** Drives the floating "On this page" guide. */
  sections: PageSection[]
}

export const PAGES: PageDef[] = [
  {
    id: 'controls',
    label: 'Controls',
    title: 'Control Playground',
    subtitle: 'Every XeX control, live. Switch theme, font and mode at any time.',
    icon: AdjustmentsHorizontalIcon,
    component: Playground,
    sections: SECTIONS,
  },
  {
    id: 'typography',
    label: 'Typography',
    title: 'Typography',
    subtitle: 'Type scale and weights in the active font.',
    icon: DocumentTextIcon,
    component: Typography,
    sections: TYPE_SECTIONS,
  },
  {
    id: 'icons',
    label: 'Icons',
    title: 'Icons',
    subtitle: 'Heroicons: styles, sizes and a searchable browser.',
    icon: PhotoIcon,
    component: Icons,
    sections: ICON_SECTIONS,
  },
]
