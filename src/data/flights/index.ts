import type { Flight } from '../types'
import { dubaiLondon } from './dubai-london'
import { jfkCopenhagen } from './jfk-copenhagen'

/** All available flights. Add new ones here; the first is the default. */
export const flights: Flight[] = [dubaiLondon, jfkCopenhagen]

export const defaultFlight = flights[0]
