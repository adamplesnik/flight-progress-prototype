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
  /** Time label under the city name, e.g. "03:40 GST →" */
  label: string
}

export type Flight = {
  id: string
  title: string
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
  label: string
  /** Centre of the route dot; the route starts or ends here */
  dot: Point
  placement: CitySide
  /** Which dot edge the city text lines up with */
  align: 'start' | 'end'
}

export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
export type Orientation = 'row' | 'column'

/** Everything the scene needs to know about where things go. */
export type SceneLayout = {
  /** The part of the world on screen: map position at the scene's top-left, scene px per map unit */
  map: { x: number; y: number; scale: number }
  /** SVG path from origin to destination, in scene pixels */
  route: string
  origin: PlacedCity
  destination: PlacedCity
  progress: { corner: Corner; rows: 1 | 2 }
  flightData: { corner: Corner; orientation: Orientation }
  report: { scale: number; warnings: string[] }
}
