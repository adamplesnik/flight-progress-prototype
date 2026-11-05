/**
 * Geographic coordinates → world map units of /assets/150bf.svg.
 *
 * The map's projection is not a standard one (close to Natural Earth, stretched by hand),
 * so this is an empirical fit: a polynomial fitted to known coastline extremes, plus a
 * local correction that pulls it onto those control points. Typical error is under 1°.
 */
export type LatLon = { lat: number; lon: number }
type Anchor = [lon: number, lat: number, residual: number]

const RAD = Math.PI / 180
const X_COEFFS = [1977.8578, 646.6522, -55.2644, -34.5948, -33.8898, 28.1855]
const Y_COEFFS = [1007.5086, -731.7978, -19.9525, 18.9891, 1.3954, -0.89]
const SMOOTHING = 16 // deg²; larger = softer local correction

const X_ANCHORS: Anchor[] = [
  [113.15, -26.15, 38.24],
  [153.64, -28.64, 15.34],
  [178.55, -37.69, -17.27],
  [166.42, -45.9, -29.9],
  [174.3, -41.7, -21.46],
  [-34.79, -7.15, -9.2],
  [-73.99, -7.5, -12.08],
  [16.45, -28.6, -29.85],
  [32.89, -26.8, -28.01],
  [43.2, -21.9, -21.18],
  [50.5, -15.4, -14.14],
  [-124.73, 48.17, -10.71],
  [-66.95, 44.8, 25.82],
  [-117.12, 32.53, 19.52],
  [68.2, 23.7, 3.16],
  [97.4, 28.2, 1.05],
  [-73.0, 78.2, -4.03],
  [-12.2, 81.6, -13.2],
  [-24.5, 65.5, 10.16],
  [-13.5, 65.0, 3.44],
  [73.5, 39.4, -7.27],
  [134.77, 48.3, -30.15],
  [-17.53, 14.7, 1.82],
  [-9.5, 38.78, 8.02],
  [51.4, 10.4, -0.13],
  [55.67, 20.0, 1.86],
  [-81.33, -4.68, -12.03],
  [-53.1, -32.7, -26.7],
  [55.37, 25.25, 8.32],
  [-0.12, 51.5, 13.05],
  [180, -17, -12.79],
  [-180, -17, 27.0],
  [144.6, -41.0, 45.57],
  [148.35, -41.0, 47.23],
  [146.4, -39.14, 30.5],
]
const Y_ANCHORS: Anchor[] = [
  [142.53, -10.69, 8.04],
  [146.4, -39.14, -17.74],
  [173.0, -34.4, 5.13],
  [175.3, -41.6, 5.22],
  [168.3, -46.65, 4.39],
  [-60.2, 5.27, -1.29],
  [-53.37, -33.75, 1.13],
  [20.0, -34.83, 1.63],
  [29.4, -22.13, 1.45],
  [49.3, -11.95, 1.86],
  [46.3, -25.6, 1.41],
  [-95.15, 49.38, -1.7],
  [-92.2, 14.53, -4.58],
  [-106.5, 32.72, -4.95],
  [77.55, 8.07, -1.63],
  [77.8, 35.5, -2.87],
  [-33.0, 83.6, -1.17],
  [-43.9, 59.8, -1.17],
  [-16.2, 66.53, 2.29],
  [-18.9, 63.4, 1.02],
  [122.5, 53.56, -0.72],
  [-8.2, 37.0, 1.17],
  [9.85, 37.35, -0.75],
  [32.0, 31.65, -0.66],
  [104.3, 77.7, 0.39],
  [-156.5, 71.38, 1.96],
  [55.37, 25.25, 18.24],
  [-0.12, 51.5, -7.39],
  [146.0, -40.7, -8.96],
  [146.8, -43.64, 0.24],
]

function correction(lon: number, lat: number, anchors: Anchor[]) {
  let sum = 0
  let weights = 0
  for (const [a, b, residual] of anchors) {
    const w = ((lon - a) ** 2 + (lat - b) ** 2 + SMOOTHING) ** -1.5
    sum += w * residual
    weights += w
  }
  return sum / weights
}

const dot = (a: number[], b: number[]) =>
  a.reduce((sum, v, i) => sum + v * b[i], 0)

/** Position on the Atlantic-centred source map, in its own units. */
export function projectToSource({ lat, lon }: LatLon) {
  const l = lon * RAD
  const p = lat * RAD
  const x = dot(X_COEFFS, [1, l, l * p * p, l * p ** 4, p, p * p])
  const y = dot(Y_COEFFS, [1, p, p ** 3, p ** 5, l * l, l * l * p * p])
  return {
    x: x + correction(lon, lat, X_ANCHORS),
    y: y + correction(lon, lat, Y_ANCHORS),
  }
}

/** Great-circle positions from `a` to `b`, `steps + 1` points including both ends. */
export function greatCircle(a: LatLon, b: LatLon, steps: number): LatLon[] {
  const toVector = ({ lat, lon }: LatLon) => [
    Math.cos(lat * RAD) * Math.cos(lon * RAD),
    Math.cos(lat * RAD) * Math.sin(lon * RAD),
    Math.sin(lat * RAD),
  ]
  const va = toVector(a)
  const vb = toVector(b)
  const angle = Math.acos(Math.min(1, Math.max(-1, dot(va, vb))))
  if (angle < 1e-6) return Array.from({ length: steps + 1 }, () => a)
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    const ka = Math.sin((1 - t) * angle) / Math.sin(angle)
    const kb = Math.sin(t * angle) / Math.sin(angle)
    const [x, y, z] = va.map((v, k) => ka * v + kb * vb[k])
    return {
      lat: Math.atan2(z, Math.hypot(x, y)) / RAD,
      lon: Math.atan2(y, x) / RAD,
    }
  })
}

/** Great-circle distance in km. */
export function distanceKm(a: LatLon, b: LatLon) {
  const h =
    Math.sin(((b.lat - a.lat) * RAD) / 2) ** 2 +
    Math.cos(a.lat * RAD) *
      Math.cos(b.lat * RAD) *
      Math.sin(((b.lon - a.lon) * RAD) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

export type WorldMap = {
  src: string
  width: number
  height: number
  /** Source position → this map's units */
  fromSource: (p: { x: number; y: number }) => { x: number; y: number }
}

const SOURCE_WIDTH = 4003.05
const SOURCE_HEIGHT = 1721.37
// The source map repeats every WRAP_PERIOD units: Fiji's halves meet at x≈3993 and x≈2 (17°S).
const WRAP_PERIOD = 3991
const PACIFIC_CUT = 2400
const PACIFIC_OFFSET = 1790

/** Rings east of the cut are moved to the left of the map: scripts/generate-pacific-map.mjs */
export const PACIFIC = {
  cut: PACIFIC_CUT,
  period: WRAP_PERIOD,
  offset: PACIFIC_OFFSET,
  width: 4250,
}

/** Available maps. The first one that shows a route without a jump is used. */
export const WORLD_MAPS: WorldMap[] = [
  {
    src: '/assets/150bf.svg',
    width: SOURCE_WIDTH,
    height: SOURCE_HEIGHT,
    fromSource: (p) => p,
  },
  {
    src: '/assets/world-pacific.svg',
    width: PACIFIC.width,
    height: SOURCE_HEIGHT,
    fromSource: ({ x, y }) => ({
      x: (x > PACIFIC.cut ? x - PACIFIC.period : x) + PACIFIC.offset,
      y,
    }),
  },
]
