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

/** All available flights, sorted by title. Add new ones here in any order. */
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
].sort((a, b) => a.title.localeCompare(b.title))

export const defaultFlight = lisZurich
