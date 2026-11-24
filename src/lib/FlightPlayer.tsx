import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { Flight } from '../data/types'
import { Header } from '../partials/Header'
import { PlaybackControls } from '../partials/PlaybackControls'
import type { SceneHandle } from '../partials/useTimeline'
import { FlightScene, type Variant } from '../partials/FlightScene'
import { rootProps, type Theme } from './theme'

export type FlightPlayerProps = {
  flight: Flight
  /** Show the flight's name above the map. Default true */
  header?: boolean
  /** With `onSelectFlight`, the name becomes a picker of these flights */
  flights?: Flight[]
  onSelectFlight?: (flight: Flight) => void
  /** Shown beside the flight's name, e.g. options of your own */
  toolbar?: ReactNode
  /** Puts the scene in a frame of your own instead of the rounded border */
  frame?: (scene: ReactNode) => ReactNode
  /** Where the flight starts (0..1 of its timeline). Default 0.2 */
  initialProgress?: number
  /** Start playing, without waiting for the play button. Default false */
  autoPlay?: boolean
  /** 'map' (the default), or 'compact' for small screens: no map, a straight track and large text, 3:2 */
  variant?: Variant
  /** Map variant only */
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
  toolbar,
  frame,
  initialProgress,
  autoPlay = false,
  variant = 'map',
  showCountryNames,
  theme,
  className,
}: FlightPlayerProps) {
  const [paused, setPaused] = useState(!autoPlay)
  const scene = useRef<SceneHandle>(null)
  const [scrubbing, setScrubbing] = useState(false)
  const sliderRef = useRef<HTMLInputElement>(null)
  // Every frame: straight to the slider, so following the animation re-renders nothing
  const progress = useRef(0)
  const showProgress = () => {
    const slider = sliderRef.current
    if (!slider) return
    slider.value = String(progress.current * 100)
    slider.style.setProperty('--value', `${progress.current * 100}%`)
  }
  const onProgress = (to: number) => {
    progress.current = to
    showProgress()
  }
  // The scene reports where it starts before the slider is there to show it
  useLayoutEffect(showProgress, [])

  const sceneView = (
    <FlightScene
      ref={scene}
      flight={flight}
      paused={paused || scrubbing}
      onProgress={onProgress}
      initialProgress={initialProgress}
      variant={variant}
      showCountryNames={showCountryNames}
    />
  )

  return (
    <div {...rootProps(`flight-player ${variant}`, theme, className)}>
      {(header || toolbar) && (
        <div className="player-header">
          {header && (
            <Header
              flight={flight}
              flights={flights}
              onSelectFlight={onSelectFlight}
            />
          )}
          {toolbar}
        </div>
      )}
      {frame ? frame(sceneView) : <div className="frame">{sceneView}</div>}
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
