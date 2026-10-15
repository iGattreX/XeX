// Optional entry point: `import { FontPicker } from '@xex/ui/font-picker'`.
// It lists every Google Font and loads fonts from Google when previewed or chosen, so apps that do
// not want those external requests simply never import it.
export { FontPicker } from './FontPicker'
export { fetchFontCatalog, useFontCatalog, type CatalogState } from './catalog'
