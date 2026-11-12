// Built into dist/style.css, which consumers import themselves
import './style.css'

export { FlightMap, type FlightMapProps } from './FlightMap'
export { FlightPlayer, type FlightPlayerProps } from './FlightPlayer'
export type { Theme } from './theme'
export {
  defaultFlight,
  findFlight,
  flightById,
  flightPath,
  flights,
  flightTitle,
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
} from '../data/flights'
export type { City, Flight, ProfileSample } from '../data/types'
export type { LatLon } from '../layout/projection'
