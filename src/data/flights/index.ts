import type { Flight } from '../types'
import { dubaiLondon } from './dubai-london'

/** All available flights. Add new ones here; the first is the default. */
export const flights: Flight[] = [dubaiLondon]

export const defaultFlight = flights[0]
