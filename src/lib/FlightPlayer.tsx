import clsx from 'clsx'
import { useCallback, useRef, useState } from 'react'
import type { Flight } from '../data/types'
import { Header } from '../partials/Header'
import { PlaybackControls } from '../partials/PlaybackControls'
import { MapScene } from '../partials/MapScene'
import { themeAttribute, type Theme } from './theme'

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
  // A seek belongs to the flight it was made on, so a new flight starts from the beginning
  const [seekState, setSeek] = useState<{
    to: number
    id: number
    flight: string
  } | null>(null)
  const seek = seekState?.flight === flight.id ? seekState : null
  const [scrubbing, setScrubbing] = useState(false)
  const sliderRef = useRef<HTMLInputElement>(null)
  // Every frame: straight to the slider, so following the animation re-renders nothing
  const onProgress = useCallback((progress: number) => {
    const slider = sliderRef.current
    if (!slider) return
    slider.value = String(progress * 100)
    slider.style.setProperty('--value', `${progress * 100}%`)
  }, [])

  return (
    <div
      className={clsx(
        'flight-progress fp:flex fp:w-full fp:flex-col fp:gap-4',
        className
      )}
      {...themeAttribute(theme)}
    >
      {header && (
        <Header
          flight={flight}
          flights={flights}
          onSelectFlight={onSelectFlight}
          showCountryNames={false}
          onToggleCountryNames={() => {}}
        />
      )}
      <div className="fp:aspect-4/3 fp:w-full fp:shrink-0 fp:overflow-hidden fp:rounded-md fp:border fp:border-outline">
        <MapScene
          flight={flight}
          paused={paused || scrubbing}
          seek={seek}
          onProgress={onProgress}
          initialProgress={initialProgress}
          showCountryNames={showCountryNames}
        />
      </div>
      <PlaybackControls
        paused={paused}
        onToggle={() => setPaused((p) => !p)}
        onSeek={(to) =>
          setSeek((prev) => ({
            to,
            id: (prev?.id ?? 0) + 1,
            flight: flight.id,
          }))
        }
        onScrubChange={setScrubbing}
        sliderRef={sliderRef}
      />
    </div>
  )
}
