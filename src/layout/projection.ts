/**
 * Geographic coordinates → world map units of src/assets/world-mercator.svg: Web Mercator, the
 * projection of Google's and Apple's flat maps. The map is a square that repeats sideways.
 */
export type LatLon = { lat: number; lon: number }

export const WORLD = { size: 4096 }

/** Where Web Mercator ends. Keep in sync with scripts/generate-world-map.mjs */
export const MAX_LAT = 85.05113

const RAD = Math.PI / 180

const dot = (a: number[], b: number[]) =>
  a.reduce((sum, v, i) => sum + v * b[i], 0)

export function project({ lat, lon }: LatLon) {
  const clamped = Math.min(MAX_LAT, Math.max(-MAX_LAT, lat))
  const north = Math.log(Math.tan(Math.PI / 4 + (clamped * RAD) / 2))
  return {
    x: ((lon + 180) / 360) * WORLD.size,
    y: WORLD.size * (0.5 - north / (2 * Math.PI)),
  }
}

/** World map units → geographic coordinates; the inverse of `project`. */
export function unproject({ x, y }: { x: number; y: number }): LatLon {
  const north = 2 * Math.PI * (0.5 - y / WORLD.size)
  return {
    lat: (2 * Math.atan(Math.exp(north)) - Math.PI / 2) / RAD,
    lon: (x / WORLD.size) * 360 - 180,
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
