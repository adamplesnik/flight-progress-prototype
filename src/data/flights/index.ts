import type { Flight } from '../types'
import { dubaiLondon } from './dubai-london'
import { jfkCopenhagen } from './jfk-copenhagen'
import { jfkSingapore } from './jfk-singapore'
import { laxAuckland } from './lax-auckland'
import { lisZurich } from './lis-zurich'
import { melbourneHobart } from './melbourne-hobart'

/** All available flights. Add new ones here; the first is the default. */
export const flights: Flight[] = [
  dubaiLondon,
  jfkCopenhagen,
  jfkSingapore,
  laxAuckland,
  lisZurich,
  melbourneHobart,
]

export const defaultFlight = flights[0]
