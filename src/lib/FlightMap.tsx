import clsx from 'clsx'
import { useEffect, useRef } from 'react'
import type { Flight } from '../data/types'
import type { SceneHandle } from '../partials/AnimatedRoute'
import { MapScene } from '../partials/MapScene'
import { themeAttribute, type Theme } from './theme'

export type FlightMapProps = {
  flight: Flight
  /**
   * Holds the flight at this point of its timeline (0..1), which spans the time on the
   * ground before take-off and after landing too. Leave it out to animate the flight.
   */
  progress?: number
  /** Where an animated flight starts (0..1). Default 0.2 */
  initialProgress?: number
  /** Stops an animated flight where it is */
  paused?: boolean
  /** Called with the timeline position (0..1) as it changes, every frame while animating */
  onProgress?: (progress: number) => void
  showCountryNames?: boolean
  theme?: Theme
  className?: string
}

/**
 * Only the map: the 4:3 scene with the route, cities and flight data, without border or
 * rounded corners. It takes the full width of its parent.
 */
export function FlightMap({
  flight,
  progress,
  initialProgress,
  paused = false,
  onProgress,
  showCountryNames,
  theme,
  className,
}: FlightMapProps) {
  const held = progress !== undefined
  const scene = useRef<SceneHandle>(null)
  // A new `progress` moves the held flight there
  useEffect(() => {
    if (progress !== undefined) scene.current?.seekTo(progress)
  }, [progress])

  return (
    <div
      className={clsx('flight-progress fp:aspect-4/3 fp:w-full', className)}
      {...themeAttribute(theme)}
    >
      <MapScene
        ref={scene}
        flight={flight}
        paused={held || paused}
        onProgress={onProgress}
        initialProgress={held ? progress : initialProgress}
        showCountryNames={showCountryNames}
      />
    </div>
  )
}
