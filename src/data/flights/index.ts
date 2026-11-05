import type { Flight } from '../types'
import { dubaiLondon } from './dubai-london'
import { jfkCopenhagen } from './jfk-copenhagen'
import { laxAuckland } from './lax-auckland'
import { melbourneHobart } from './melbourne-hobart'

/** All available flights. Add new ones here; the first is the default. */
export const flights: Flight[] = [
  dubaiLondon,
  jfkCopenhagen,
  laxAuckland,
  melbourneHobart,
]

export const defaultFlight = flights[0]
