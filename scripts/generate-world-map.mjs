// Generates the Web Mercator world map and the country names that go on it, from Natural
// Earth (public domain, through the world-atlas package):
//   public/assets/world-mercator.svg
//   src/data/countryLabels.ts
// Run: node scripts/generate-world-map.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { feature, mesh } from 'topojson-client'

// Keep in sync with src/layout/projection.ts
const WORLD_SIZE = 4096
const MAX_LAT = 85.05113

const RAD = Math.PI / 180
const project = ([lon, lat]) => {
  const clamped = Math.min(MAX_LAT, Math.max(-MAX_LAT, lat))
  return [
    ((lon + 180) / 360) * WORLD_SIZE,
    WORLD_SIZE *
      (0.5 - Math.log(Math.tan(Math.PI / 4 + (clamped * RAD) / 2)) / (2 * Math.PI)),
  ]
}

const require = createRequire(import.meta.url)
const topology = JSON.parse(
  readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8')
)
const countries = feature(topology, topology.objects.countries).features
const polygonsOf = ({ geometry: { type, coordinates } }) =>
  type === 'Polygon' ? [coordinates] : coordinates

// --- Map ---------------------------------------------------------------------------------

/** Relative coordinates in hundredths of a unit: small, with no rounding drift. */
function pathData(line, close) {
  const hundredths = line.map(([x, y]) => [Math.round(x * 100), Math.round(y * 100)])
  const [[startX, startY]] = hundredths
  let [x, y] = [startX, startY]
  const moves = []
  for (const [nx, ny] of hundredths.slice(1)) {
    if (nx === x && ny === y) continue
    moves.push(`${(nx - x) / 100} ${(ny - y) / 100}`)
    x = nx
    y = ny
  }
  return `M${startX / 100} ${startY / 100}l${moves.join(' ')}${close ? 'z' : ''}`.replace(/ -/g, '-')
}

/**
 * The data has no cuts at the date line: a line crossing it jumps from one side of the map
 * to the other. Carry on past the map's side instead, into where the next copy goes.
 */
function continuous(line) {
  const out = []
  for (const [lon, lat] of line) {
    const previous = out[out.length - 1]
    const copies = previous ? Math.round((previous[0] - lon) / 360) : 0
    out.push([lon + copies * 360, lat])
  }
  return out
}

/** A closed ring on the map, in map units. Most of it sits within the map's own width. */
function ringOnMap(ring) {
  const line = continuous(ring)
  const [firstLon, firstLat] = line[0]
  const lastLon = line[line.length - 1][0]
  // Antarctica goes all the way round: close it along the bottom of the map
  const closed =
    Math.abs(lastLon - firstLon) > 180
      ? [...line, [lastLon, -90], [firstLon, -90], [firstLon, firstLat]]
      : line
  const points = closed.map(project)
  const xs = points.map((p) => p[0])
  const middle = (Math.min(...xs) + Math.max(...xs)) / 2
  const shift = -Math.floor(middle / WORLD_SIZE) * WORLD_SIZE
  return points.map(([x, y]) => [x + shift, y])
}

const land = countries
  .flatMap(polygonsOf)
  .flat()
  .map((ring) => pathData(ringOnMap(ring), true))
  .join('')

const lines = mesh(topology, topology.objects.countries)
  .coordinates.map((line) => pathData(continuous(line).map(project), false))
  .join('')

writeFileSync(
  'public/assets/world-mercator.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WORLD_SIZE} ${WORLD_SIZE}">
<g id="world">
<path fill="#FAFAFA" d="${land}"/>
<path fill="none" stroke="#B3B3B3" stroke-linecap="round" stroke-linejoin="round" d="${lines}"/>
</g>
</svg>
`
)

// --- Country names -----------------------------------------------------------------------
// One name per country that can fit it (16px regular text) fully inside its outline.

const FONT_SIZE = 16
const PAD = 3 // minimum clearance (map units) left and right of the text
const NOT_LABELLED = new Set(['Antarctica'])
const NAMES = {
  'United States of America': 'United States',
  'Dem. Rep. Congo': 'DR Congo',
  'Bosnia and Herz.': 'Bosnia & Herz.',
  'S. Sudan': 'South Sudan',
  'United Arab Emirates': 'UAE',
  'Macedonia': 'North Macedonia',
  'eSwatini': 'Eswatini',
}

// Rough Inter Regular advance widths in em
const NARROW = new Set("ijltfr’.,' I")
const WIDE = new Set('mwMW')
function textWidth(text) {
  let em = 0
  for (const c of text) {
    if (c === ' ') em += 0.28
    else if (NARROW.has(c)) em += 0.3
    else if (WIDE.has(c)) em += 0.88
    else if (c >= 'A' && c <= 'Z') em += 0.68
    else em += 0.56
  }
  return em * FONT_SIZE
}

function rowIntervals(rings, y) {
  const xs = []
  for (const ring of rings)
    for (let i = 0; i < ring.length; i++) {
      const [x1, y1] = ring[i]
      const [x2, y2] = ring[(i + 1) % ring.length]
      if (y1 <= y !== y2 <= y) xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1))
    }
  xs.sort((a, b) => a - b)
  const intervals = []
  for (let i = 0; i + 1 < xs.length; i += 2) intervals.push([xs[i], xs[i + 1]])
  return intervals
}

function labelPosition(rings, width) {
  const points = rings.flat()
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  if (maxX - minX < width + 2 * PAD || maxY - minY < FONT_SIZE) return null

  const rows = new Map()
  const rowAt = (y) => {
    const key = Math.round(y)
    if (!rows.has(key)) rows.set(key, rowIntervals(rings, key + 0.01))
    return rows.get(key)
  }
  const middle = [(minX + maxX) / 2, (minY + maxY) / 2]
  let best = null
  for (let cy = minY + 8; cy <= maxY - 8; cy += 2) {
    const sample = [-6, -3, 0, 3, 6].map((dy) => rowAt(cy + dy))
    for (const [left, right] of sample[2])
      for (let cx = left + width / 2; cx <= right - width / 2; cx += 2) {
        let slack = Infinity
        for (const intervals of sample) {
          const hit = intervals.find(
            ([a, b]) => a <= cx - width / 2 && b >= cx + width / 2
          )
          if (!hit) {
            slack = -1
            break
          }
          slack = Math.min(slack, cx - width / 2 - hit[0], hit[1] - cx - width / 2)
        }
        if (slack < PAD) continue
        const score = slack - 0.02 * Math.hypot(cx - middle[0], cy - middle[1])
        if (!best || score > best.score) best = { score, x: cx, y: cy }
      }
  }
  return best
}

const labels = countries.flatMap((country) => {
  const atlasName = country.properties.name
  if (NOT_LABELLED.has(atlasName)) return []
  const name = NAMES[atlasName] ?? atlasName
  const rings = polygonsOf(country).flat().map(ringOnMap)
  const at = labelPosition(rings, textWidth(name))
  return at ? [{ name, x: +at.x.toFixed(1), y: +at.y.toFixed(1) }] : []
})

writeFileSync(
  'src/data/countryLabels.ts',
  `// Generated by scripts/generate-world-map.mjs — do not edit by hand.
// Coordinates are in world map units (see src/layout/projection.ts).
export type CountryLabel = { name: string; x: number; y: number }

export const countryLabels: CountryLabel[] = [
${labels.map(({ name, x, y }) => `  { name: ${JSON.stringify(name)}, x: ${x}, y: ${y} },`).join('\n')}
]
`
)

console.log(
  `map ${Math.round((land.length + lines.length) / 1024)} KB, ${labels.length} labels`
)
