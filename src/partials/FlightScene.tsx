import type { Ref } from 'react'
import type { Flight } from '../data/types'
import { CompactScene } from './CompactScene'
import { MapScene } from './MapScene'
import type { SceneHandle } from './useTimeline'

/** 'map' shows the route on a world map (4:3); 'compact' is for small screens (3:2) */
export type Variant = 'map' | 'compact'

/** The scene of the chosen variant. */
export function FlightScene({
  variant,
  showCountryNames,
  ...props
}: {
  variant: Variant
  flight: Flight
  paused: boolean
  onProgress?: (progress: number) => void
  initialProgress?: number
  showCountryNames?: boolean
  ref?: Ref<SceneHandle>
}) {
  return variant === 'compact' ? (
    <CompactScene {...props} />
  ) : (
    <MapScene {...props} showCountryNames={showCountryNames} />
  )
}
