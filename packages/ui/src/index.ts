// Components
export * from './components'

// App shell pieces
export { Header } from './layout/Header'
export { PageGuide } from './layout/PageGuide'
export { Section, type PageSection } from './layout/Section'
export { Sidebar, SidebarBrand, type NavEntry } from './layout/Sidebar'
export { useSidebarCollapsed } from './layout/useSidebarCollapsed'

// Theming
export { ThemeProvider, useTheme, type ColorMode, type ThemeContextValue, type ThemeProviderProps } from './theme/ThemeContext'
export { ThemeSwitcher } from './theme/ThemeSwitcher'
