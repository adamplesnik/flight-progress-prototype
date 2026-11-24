import type { Flight } from '../types'

/** A flight's name, e.g. 'Lisboa – Zürich' */
export const flightTitle = (flight: Flight) =>
  `${flight.origin.city} – ${flight.destination.city}`

/**
 * All available flights, sorted by title: every file in this folder but this one, each a
 * flight as its default export. A flight is reached by its id, the file name:
 * flightById('lis-zurich').
 */
export const flights: Flight[] = Object.values(
  import.meta.glob<Flight>(['./*.ts', '!./index.ts'], {
    eager: true,
    import: 'default',
  })
).sort((a, b) => flightTitle(a).localeCompare(flightTitle(b)))

/** A flight's URL path from its airports' ICAO codes, e.g. '/LPPT-LSZH' */
export const flightPath = (flight: Flight) =>
  `/${flight.origin.icao}-${flight.destination.icao}`

/** The flight at a path segment like 'LPPT-LSZH', in any letter case */
export const findFlight = (route: string) =>
  flights.find((f) => flightPath(f) === `/${route.toUpperCase()}`)

/** The flight with this id (its file name), e.g. 'lis-zurich' */
export const flightById = (id: string) => flights.find((f) => f.id === id)

export const defaultFlight = flightById('lis-zurich')!
