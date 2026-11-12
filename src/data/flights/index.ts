import type { Flight } from "../types"
import { detroitShanghai } from "./detroit-shanghai"
import { dubaiLondon } from "./dubai-london"
import { jfkCopenhagen } from "./jfk-copenhagen"
import { jfkSingapore } from "./jfk-singapore"
import { johannesburgSydney } from "./johannesburg-sydney"
import { laxAuckland } from "./lax-auckland"
import { lisZurich } from "./lis-zurich"
import { melbourneHobart } from "./melbourne-hobart"
import { melbourneToulouse } from "./melbourne-toulouse"
import { mexicoCityToronto } from "./mexico-city-toronto"
import { seoulHelsinki } from "./seoul-helsinki"

/** A flight's name, e.g. "Lisboa – Zürich" */
export const flightTitle = (flight: Flight) =>
  `${flight.origin.city} – ${flight.destination.city}`

/** All available flights, sorted by title. Add new ones here in any order. */
export const flights: Flight[] = [
  dubaiLondon,
  jfkCopenhagen,
  jfkSingapore,
  laxAuckland,
  lisZurich,
  melbourneHobart,
  melbourneToulouse,
  seoulHelsinki,
  detroitShanghai,
  johannesburgSydney,
  mexicoCityToronto,
].sort((a, b) => flightTitle(a).localeCompare(flightTitle(b)))

export const defaultFlight = lisZurich

/** A flight's URL path from its airports' ICAO codes, e.g. "/LPPT-LSZH" */
export const flightPath = (flight: Flight) =>
  `/${flight.origin.icao}-${flight.destination.icao}`

/** The flight at a path segment like "LPPT-LSZH", in any letter case */
export const findFlight = (route: string) =>
  flights.find((f) => flightPath(f) === `/${route.toUpperCase()}`)
