import type { Flight } from '../types'
import { detroitShanghai } from './detroit-shanghai'
import { dubaiLondon } from './dubai-london'
import { jfkCopenhagen } from './jfk-copenhagen'
import { jfkSingapore } from './jfk-singapore'
import { johannesburgSydney } from './johannesburg-sydney'
import { laxAuckland } from './lax-auckland'
import { lisZurich } from './lis-zurich'
import { sydneyHobart } from './sydney-hobart'
import { melbourneToulouse } from './melbourne-toulouse'
import { mexicoCityToronto } from './mexico-city-toronto'
import { seoulHelsinki } from './seoul-helsinki'

/** A flight's name, e.g. 'Lisboa – Zürich' */
export const flightTitle = (flight: Flight) =>
  `${flight.origin.city} – ${flight.destination.city}`

/** All available flights, sorted by title. Add new ones here in any order. */
export const flights: Flight[] = [
  dubaiLondon,
  jfkCopenhagen,
  jfkSingapore,
  laxAuckland,
  lisZurich,
  sydneyHobart,
  melbourneToulouse,
  seoulHelsinki,
  detroitShanghai,
  johannesburgSydney,
  mexicoCityToronto,
].sort((a, b) => flightTitle(a).localeCompare(flightTitle(b)))

export const defaultFlight = lisZurich

/** A flight's URL path, its id, e.g. '/LPPT-LSZH' */
export const flightPath = (flight: Flight) => `/${flight.id}`

/** The flight with this id, its airports' ICAO codes like 'LPPT-LSZH', in any letter case */
export const flightById = (id: string) =>
  flights.find((f) => f.id === id.toUpperCase())

/** The flight at a path segment like 'LPPT-LSZH': the same as flightById */
export const findFlight = flightById

export {
  detroitShanghai,
  dubaiLondon,
  jfkCopenhagen,
  jfkSingapore,
  johannesburgSydney,
  laxAuckland,
  lisZurich,
  melbourneToulouse,
  mexicoCityToronto,
  seoulHelsinki,
  sydneyHobart,
}
