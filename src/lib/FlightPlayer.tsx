import { useRef, useState } from 'react'
import type { Flight } from '../data/types'
import { Header } from '../partials/Header'
import { PlaybackControls } from '../partials/PlaybackControls'
import type { SceneHandle } from '../partials/AnimatedRoute'
import { MapScene } from '../partials/MapScene'
import { rootProps, type Theme } from './theme'

export type FlightPlayerProps = {
  flight: Flight
  /** Show the flight's name above the map. Default true */
  header?: boolean
  /** With `onSelectFlight`, the name becomes a picker of these flights */
  flights?: Flight[]
  onSelectFlight?: (flight: Flight) => void
  /** Where the flight starts (0..1 of its timeline). Default 0.2 */
  initialProgress?: number
  /** Start paused. Default false */
  initiallyPaused?: boolean
  showCountryNames?: boolean
  theme?: Theme
  className?: string
}

/**
 * The whole view: the flight's name, the map in a rounded frame, and play/pause with a
 * slider to scrub through the flight. It takes the full width of its parent.
 */
export function FlightPlayer({
  flight,
  header = true,
  flights = [],
  onSelectFlight,
  initialProgress,
  initiallyPaused = false,
  showCountryNames,
  theme,
  className,
}: FlightPlayerProps) {
  const [paused, setPaused] = useState(initiallyPaused)
  const scene = useRef<SceneHandle>(null)
  const [scrubbing, setScrubbing] = useState(false)
  const sliderRef = useRef<HTMLInputElement>(null)
  // Every frame: straight to the slider, so following the animation re-renders nothing
  const onProgress = (progress: number) => {
    const slider = sliderRef.current
    if (!slider) return
    slider.value = String(progress * 100)
    slider.style.setProperty('--value', `${progress * 100}%`)
  }

  return (
    <div {...rootProps('flight-player', theme, className)}>
      {header && (
        <Header
          flight={flight}
          flights={flights}
          onSelectFlight={onSelectFlight}
        />
      )}
      <div className="frame">
        <MapScene
          ref={scene}
          flight={flight}
          paused={paused || scrubbing}
          onProgress={onProgress}
          initialProgress={initialProgress}
          showCountryNames={showCountryNames}
        />
      </div>
      <PlaybackControls
        paused={paused}
        onToggle={() => setPaused((p) => !p)}
        onSeek={(to) => scene.current?.seekTo(to)}
        onScrubChange={setScrubbing}
        sliderRef={sliderRef}
      />
    </div>
  )
}
