import type { LatLon } from '../layout/projection'

/** One row of a flight profile: [speed km/h, altitude ft, temperature °C, remaining km]. */
export type ProfileSample = [
  kmh: number,
  feet: number,
  celsius: number,
  remainingKm: number,
]

/** Position and size in percent of the 4:3 scene. */
export type Box = { left: number; top: number; width: number; height: number }

/** A point in scene pixels (1024 × 768). */
export type Point = { x: number; y: number }

export type Side = 'above' | 'below'

export type City = LatLon & {
  city: string
  /** Time label under the city name, e.g. "03:40 GST →" */
  label: string
}

/** A hand-tuned layout: the route and map are placed by hand. */
export type ManualLayout = {
  cities: Side
  origin: { dot: Point; align?: 'start' | 'end' }
  destination: { dot: Point; align?: 'start' | 'end' }
  map: { src: string; box: Box }
  /** SVG path from origin to destination, in scene pixels */
  route: string
}

export type Flight = {
  id: string
  title: string
  origin: City
  destination: City
  /** Points the route passes through, for routes that are not a great circle */
  waypoints?: LatLon[]
  /** Hand-tuned alternative to the computed layout */
  manual?: ManualLayout
  profile: {
    samples: ProfileSample[]
    /** Minutes between two samples */
    stepMin: number
  }
  timeline: {
    /** Clock time of take-off, in minutes after midnight */
    takeoffClockMin: number
    /** Minutes on the ground before take-off (the animation starts here) */
    preDepartureMin: number
    /** Minutes at the gate after landing */
    postArrivalMin: number
    /** Last minutes before take-off spent taxiing */
    taxiMin: number
    taxiKnots: number
  }
}

export type Endpoint = {
  city: string
  label: string
  /** Centre of the route dot; the route starts or ends here */
  dot: Point
  /** Which dot edge the city text lines up with (default: start/left) */
  align?: 'start' | 'end'
}

export type CitySide = Side | 'left' | 'right'
export type PlacedCity = Endpoint & { placement: CitySide }

export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
export type Orientation = 'row' | 'column'

export type LabelAnchor =
  | 'above-end'
  | 'above-start'
  | 'below-end'
  | 'below-start'
  | 'left-bottom'
  | 'left-top'
  | 'right-bottom'
  | 'right-top'

/** Where the progress label sits, from a share (0..1) of the route onwards. */
export type LabelStep = {
  from: number
  /** Label box relative to the marker */
  dx: number
  dy: number
  w: number
  h: number
  align: 'left' | 'right'
  /** Rows used by km and mi */
  rows: 1 | 2
}

/** Everything the scene needs to know about where things go. */
export type SceneLayout = {
  map: { src: string; box: Box }
  /** SVG path from origin to destination, in scene pixels */
  route: string
  origin: PlacedCity
  destination: PlacedCity
  /**
   * 'fixed': below the marker. 'avoid': placed live, frame by frame.
   * 'plan': a precomputed plan for the whole flight.
   */
  label:
    { kind: 'fixed' } | { kind: 'avoid' } | { kind: 'plan'; steps: LabelStep[] }
  flightData: { corner: Corner; orientation: Orientation }
  clock: { corner: Corner }
  /** Only for computed layouts */
  report?: {
    scale: number
    evaluations: number
    /** How many candidates each rule rejected, for tuning */
    rejected: Record<'cities' | 'label' | 'corners' | 'between', number>
    warnings: string[]
  }
}
