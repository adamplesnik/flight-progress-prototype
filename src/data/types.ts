/** One row of a flight profile: [speed km/h, altitude ft, temperature °C, remaining km]. */
export type ProfileSample = [
  kmh: number,
  feet: number,
  celsius: number,
  remainingKm: number,
]

/** Position and size in percent of the 4:3 scene. */
export type Box = { left: number; top: number; width: number; height: number }

export type Endpoint = {
  city: string
  /** Time label under the city name, e.g. "03:40 GST →" */
  label: string
  /** Top-left corner of the city cluster, in percent of the scene */
  position: { left: number; top: number }
}

export type Flight = {
  id: string
  title: string
  origin: Endpoint
  destination: Endpoint
  map: {
    /** URL of the world map image */
    src: string
    /** Where the map image sits in the scene (it is usually larger than the scene) */
    box: Box
  }
  route: {
    /** SVG path from origin to destination, in `viewBox` units */
    geometry: string
    viewBox: { width: number; height: number }
    /** Where the route SVG sits in the scene */
    box: Box
  }
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
