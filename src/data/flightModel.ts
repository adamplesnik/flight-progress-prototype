import type { Flight, ProfileSample } from './types'

const KMH_PER_KNOT = 1.852
const MPH_PER_KNOT = 1.15078
const M_PER_FT = 0.3048
const MI_PER_KM = 0.621371

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)
const roundTo = (value: number, step: number) => Math.round(value / step) * step
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const pad = (n: number) => String(n).padStart(2, '0')
const fmt = (n: number) => n.toLocaleString('en-US')

export type FlightReadout = {
  clock: string
  remaining: string
  kmh: string
  mph: string
  meters: string
  feet: string
  celsius: string
  fahrenheit: string
  km: string
  miles: string
}

/**
 * Builds the time-based model of a flight: readouts and distance flown for any
 * point (0..1) on the timeline from EOBT to the end of the parking time.
 */
export function createFlightModel(flight: Flight) {
  const { samples, stepMin } = flight.profile
  const {
    takeoffClockMin,
    preDepartureMin,
    postArrivalMin,
    taxiMin,
    taxiKnots,
  } = flight.timeline
  const flightMin = (samples.length - 1) * stepMin
  const totalMin = preDepartureMin + flightMin + postArrivalMin
  const startClockMin = takeoffClockMin - preDepartureMin

  /** Minutes since the start of the timeline for a 0..1 timeline progress. */
  const elapsedMinutes = (progress: number) => clamp(progress, 0, 1) * totalMin

  /** Minutes since take-off (0 before it, `flightMin` after landing). */
  const flightMinutes = (elapsed: number) =>
    clamp(elapsed - preDepartureMin, 0, flightMin)

  /** Interpolates the profile between two samples at `minutes` after take-off. */
  const sampleAt = (minutes: number) => {
    const i = Math.min(Math.floor(minutes / stepMin), samples.length - 2)
    const t = (minutes - i * stepMin) / stepMin
    return samples[i].map((v, k) =>
      lerp(v, samples[i + 1][k], t)
    ) as ProfileSample
  }

  /** progress: 0..1 across the whole timeline. Values are interpolated linearly, then snapped. */
  function readoutAt(progress: number): FlightReadout {
    const elapsed = elapsedMinutes(progress)
    const minutes = flightMinutes(elapsed)
    const [kmh, ft, c, d] = sampleAt(minutes)

    // time: whole minutes
    const wholeMin = Math.floor(elapsed)
    const clockMin = (((startClockMin + wholeMin) % 1440) + 1440) % 1440
    const left = flightMin - Math.floor(minutes) // frozen until take-off
    // speed: nearest 5 knots
    const parked = elapsed > preDepartureMin + flightMin
    const taxiing =
      elapsed >= preDepartureMin - taxiMin && elapsed < preDepartureMin
    const knots = parked
      ? 0
      : taxiing
        ? taxiKnots
        : roundTo(kmh / KMH_PER_KNOT, 5)
    // altitude: nearest 100 ft
    const feet = roundTo(ft, 100)
    // distance: nearest 10 km
    const km = roundTo(d, 10)
    const celsius = Math.round(c)

    return {
      clock: `${pad(Math.floor(clockMin / 60))}:${pad(clockMin % 60)}`,
      remaining: `${Math.floor(left / 60)}:${pad(left % 60)}`,
      kmh: fmt(Math.round(knots * KMH_PER_KNOT)),
      mph: fmt(Math.round(knots * MPH_PER_KNOT)),
      meters: fmt(Math.round(feet * M_PER_FT)),
      feet: fmt(feet),
      celsius: String(celsius),
      fahrenheit: String(Math.round((celsius * 9) / 5 + 32)),
      km: fmt(km),
      miles: fmt(Math.round(km * MI_PER_KM)),
    }
  }

  /** Share of the route already flown (0..1) at `progress` (0..1) of the timeline. */
  function distanceProgressAt(progress: number): number {
    const [, , , remainingKm] = sampleAt(
      flightMinutes(elapsedMinutes(progress))
    )
    return 1 - remainingKm / samples[0][3]
  }

  return { readoutAt, distanceProgressAt }
}

export type FlightModel = ReturnType<typeof createFlightModel>
