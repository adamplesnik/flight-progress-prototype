import type { Flight } from '../types'
import { detroitShanghai } from './detroit-shanghai'
import { dubaiLondon } from './dubai-london'
import { jfkCopenhagen } from './jfk-copenhagen'
import { jfkSingapore } from './jfk-singapore'
import { johannesburgSydney } from './johannesburg-sydney'
import { laxAuckland } from './lax-auckland'
import { lisZurich } from './lis-zurich'
import { melbourneHobart } from './melbourne-hobart'
import { mexicoCityToronto } from './mexico-city-toronto'
import { seoulHelsinki } from './seoul-helsinki'

/** All available flights. Add new ones here; the first is the default. */
export const flights: Flight[] = [
  dubaiLondon,
  jfkCopenhagen,
  jfkSingapore,
  laxAuckland,
  lisZurich,
  melbourneHobart,
  seoulHelsinki,
  detroitShanghai,
  johannesburgSydney,
  mexicoCityToronto,
]

export const defaultFlight = flights[0]
