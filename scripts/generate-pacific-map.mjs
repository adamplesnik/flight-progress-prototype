// Generates public/assets/world-pacific.svg from the Atlantic-centred 150bf.svg: every ring
// east of the cut moves one map period to the left, so the Pacific ends up in the middle.
// Run: node scripts/generate-pacific-map.mjs
import { readFileSync, writeFileSync } from 'node:fs'

// Keep in sync with PACIFIC in src/layout/projection.ts
const CUT = 2400
const PERIOD = 3991
const OFFSET = 1790
const WIDTH = 4250
const HEIGHT = 1721.37

const svg = readFileSync('public/assets/150bf.svg', 'utf8')
const round = (n) => +n.toFixed(2)

/** Splits a path into rings of absolute commands: [{ cmd, nums }]. */
function parseRings(d) {
  const rings = []
  let ring = null
  for (const [, cmd, args] of d.matchAll(/([MLHVCZ])([^MLHVCZ]*)/g)) {
    const nums = args
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number)
    if (cmd === 'M') {
      ring = []
      rings.push(ring)
    }
    ring.push({ cmd, nums })
  }
  return rings
}

/** Horizontal extent of a ring; H carries x, V carries none, others alternate x,y. */
function extent(ring) {
  let min = Infinity
  let max = -Infinity
  const see = (x) => {
    min = Math.min(min, x)
    max = Math.max(max, x)
  }
  for (const { cmd, nums } of ring) {
    if (cmd === 'H') nums.forEach(see)
    else if (cmd !== 'V' && cmd !== 'Z')
      nums.forEach((n, i) => i % 2 === 0 && see(n))
  }
  return { min, max }
}

function moveRing(ring, dx) {
  return ring
    .map(({ cmd, nums }) => {
      if (cmd === 'Z') return 'Z'
      if (cmd === 'V') return `V${nums.map(round).join(' ')}`
      if (cmd === 'H') return `H${nums.map((n) => round(n + dx)).join(' ')}`
      return cmd + nums.map((n, i) => round(i % 2 === 0 ? n + dx : n)).join(' ')
    })
    .join('')
}

const paths = [...svg.matchAll(/<path ((?:[^>]*? )?)d="([^"]+)"([^>]*)>/g)].map(
  ([, before, d, after]) => {
    const moved = parseRings(d)
      .map((ring) => {
        const { min, max } = extent(ring)
        const east = (min + max) / 2 > CUT
        return moveRing(ring, OFFSET - (east ? PERIOD : 0))
      })
      .join('')
    return `<path ${before}d="${moved}"${after}>`
  }
)

writeFileSync(
  'public/assets/world-pacific.svg',
  `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg">\n<g id="World map">\n<rect width="${WIDTH}" height="${HEIGHT}" fill="#E9EBED"/>\n${paths.join('\n')}\n</g>\n</svg>\n`
)
console.log(paths.length, 'paths')
