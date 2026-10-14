// Generates public/apple-touch-icon.png and public/favicon.ico by rasterising public/favicon.svg
// (blue rounded tile + white round-capped strokes). No dependencies.
// Run: node scripts/gen-icons.mjs
//
// Understands the SVG's <rect rx>, <line x1 y1 x2 y2 stroke-width> and <path d="M x y x y M x y x y"
// stroke-width> (straight two-point sub-paths only), which is all the icon uses.
import fs from 'node:fs'
import zlib from 'node:zlib'

const BLUE = [0x25, 0x63, 0xeb]
const WHITE = [255, 255, 255]

const svg = fs.readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8')
const attr = (tag, name) => new RegExp(`\\b${name}="([^"]+)"`).exec(tag)?.[1]

const RADIUS = Number(attr(/<rect[^>]*>/.exec(svg)[0], 'rx'))

/** Stroked segments: { x1, y1, x2, y2, half } where half = half the stroke width. */
const SEGMENTS = []
for (const tag of svg.match(/<line[^>]*>/g) ?? []) {
  SEGMENTS.push({ x1: +attr(tag, 'x1'), y1: +attr(tag, 'y1'), x2: +attr(tag, 'x2'), y2: +attr(tag, 'y2'), half: +attr(tag, 'stroke-width') / 2 })
}
for (const tag of svg.match(/<path[^>]*>/g) ?? []) {
  const half = +attr(tag, 'stroke-width') / 2
  for (const m of attr(tag, 'd').matchAll(/M\s*([\d.]+)[\s,]+([\d.]+)[\s,]*L?\s*([\d.]+)[\s,]+([\d.]+)/g)) {
    SEGMENTS.push({ x1: +m[1], y1: +m[2], x2: +m[3], y2: +m[4], half })
  }
}
if (SEGMENTS.length === 0) throw new Error('No stroked segments found in public/favicon.svg')

function distToSegment(px, py, { x1, y1, x2, y2 }) {
  const dx = x2 - x1
  const dy = y2 - y1
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

const inMark = (x, y) => SEGMENTS.some((s) => distToSegment(x, y, s) <= s.half)

function insideTile(x, y, rounded) {
  if (!rounded) return true
  const cx = Math.min(Math.max(x, RADIUS), 64 - RADIUS)
  const cy = Math.min(Math.max(y, RADIUS), 64 - RADIUS)
  return Math.hypot(x - cx, y - cy) <= RADIUS
}

/** RGBA pixels, 4x4 supersampled for smooth edges. `rounded: false` fills the whole square (iOS rounds it itself). */
function render(size, rounded) {
  const px = Buffer.alloc(size * size * 4)
  const SS = 4
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      let r = 0, g = 0, b = 0, covered = 0
      for (let sj = 0; sj < SS; sj++) {
        for (let si = 0; si < SS; si++) {
          const x = ((i + (si + 0.5) / SS) * 64) / size
          const y = ((j + (sj + 0.5) / SS) * 64) / size
          if (!insideTile(x, y, rounded)) continue
          const c = inMark(x, y) ? WHITE : BLUE
          r += c[0]; g += c[1]; b += c[2]; covered++
        }
      }
      const o = (j * size + i) * 4
      px[o] = covered ? Math.round(r / covered) : 0
      px[o + 1] = covered ? Math.round(g / covered) : 0
      px[o + 2] = covered ? Math.round(b / covered) : 0
      px[o + 3] = Math.round((covered / (SS * SS)) * 255)
    }
  }
  return px
}

function png(size, rounded) {
  const raw = Buffer.alloc(size * (size * 4 + 1))
  const px = render(size, rounded)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0 // filter: none
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(zlib.crc32(td) >>> 0)
    return Buffer.concat([len, td, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))])
}

/** ICO container holding PNG-compressed images. */
function ico(sizes) {
  const images = sizes.map((s) => ({ s, data: png(s, true) }))
  const header = Buffer.alloc(6)
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(images.length, 4)
  let offset = 6 + images.length * 16
  const entries = images.map(({ s, data }) => {
    const e = Buffer.alloc(16)
    e[0] = s
    e[1] = s
    e.writeUInt16LE(1, 4) // planes
    e.writeUInt16LE(32, 6) // bpp
    e.writeUInt32LE(data.length, 8)
    e.writeUInt32LE(offset, 12)
    offset += data.length
    return e
  })
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)])
}

const out = new URL('../public/', import.meta.url)
fs.mkdirSync(out, { recursive: true })
fs.writeFileSync(new URL('apple-touch-icon.png', out), png(180, false))
fs.writeFileSync(new URL('favicon.ico', out), ico([16, 32, 48]))
console.log(`wrote public/apple-touch-icon.png and public/favicon.ico (${SEGMENTS.length} stroked segments)`)
