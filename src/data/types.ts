import type { LatLon } from '../layout/projection'

/** One row of a flight profile: [speed km/h, altitude ft, temperature °C, remaining km]. */
export type ProfileSample = [
  kmh: number,
  feet: number,
  celsius: number,
  remainingKm: number,
]

/** A point in scene pixels (1024 × 768). */
export type Point = { x: number; y: number }

export type City = LatLon & {
  city: string
  /** The airport's ICAO code, e.g. "LPPT"; flights are routed at /ORIG-DEST */
  icao: string
  /** Local time under the city name, e.g. "03:40 GST"; the arrow is added by the scene */
  time: string
}

export type Flight = {
  id: string
  origin: City
  destination: City
  /** Points the route passes through, joined by a smooth curve instead of a great circle */
  waypoints?: LatLon[]
  profile: {
    samples: ProfileSample[]
    /** Minutes between two samples */
    stepMin: number
  }
  timeline: {
    /** Minutes on the ground before take-off (the animation starts here) */
    preDepartureMin: number
    /** Minutes at the gate after landing */
    postArrivalMin: number
    /** Last minutes before take-off spent taxiing */
    taxiMin: number
    taxiKnots: number
  }
}

export type CitySide = 'above' | 'below' | 'left' | 'right'

/** A city's dot and where its text sits. */
export type PlacedCity = {
  city: string
  time: string
  /** The arrow comes before the time at the destination, after it at the origin */
  isDestination: boolean
  /** Centre of the route dot; the route starts or ends here */
  dot: Point
  placement: CitySide
  /** Which dot edge the city text lines up with */
  align: 'start' | 'end'
}

export type Orientation = 'row' | 'column'

/** Everything the scene needs to know about where things go. */
export type SceneLayout = {
  /** The part of the world on screen: map position at the scene's top-left, scene px per map unit */
  map: { x: number; y: number; scale: number }
  /** SVG path from origin to destination, in scene pixels */
  route: string
  /**
   * For each route vertex, the share of the drawn length (`path`) and of the real, geographic
   * distance (`geo`) up to it, both 0..1. Mercator stretches the far north and south, so the
   * marker uses these to sit where the aircraft really is.
   */
  routeShares: { path: number[]; geo: number[] }
  origin: PlacedCity
  destination: PlacedCity
  /** Progress and flight data: in a bottom row or a right column */
  orientation: Orientation
  /** What the layout could not do for this flight; logged in development */
  warnings: string[]
}
