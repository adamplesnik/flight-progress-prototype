import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type DependencyList,
  type Ref,
} from 'react'
import { flushSync } from 'react-dom'
import type { FlightModel, FlightReadout } from '../data/flightModel'

// Length of one full animation loop (ms)
const FLIGHT_DURATION = 40000

/** What a parent can do to the scene through its ref */
export type SceneHandle = {
  /** Jump to this point of the timeline (0..1) */
  seekTo: (progress: number) => void
}

export type TimelineOptions = {
  model: FlightModel
  onReadout: (data: FlightReadout) => void
  /** Where the flight starts (0..1), and starts again when the flight changes */
  initialProgress: number
  paused: boolean
  /** Called with the timeline position (0..1) whenever it changes */
  onProgress?: (progress: number) => void
  ref?: Ref<SceneHandle>
}

/**
 * Plays the flight's timeline (0..1) in a loop, and lets the parent seek through `ref`.
 * `setup` runs whenever `deps` change and returns what draws a timeline position, or nothing
 * while the elements are not there yet. Drawing happens outside React, every frame.
 */
export function useTimeline(
  {
    model,
    onReadout,
    initialProgress,
    paused,
    onProgress,
    ref,
  }: TimelineOptions,
  setup: () => ((at: number) => void) | undefined,
  deps: DependencyList
) {
  const jumpRef = useRef<(to: number) => void>(undefined)
  // The animation reads these as they are now, so a new callback or value does not restart it
  const latest = useRef({
    model,
    onReadout,
    onProgress,
    initialProgress,
    paused,
  })
  useLayoutEffect(() => {
    latest.current = { model, onReadout, onProgress, initialProgress, paused }
  })

  useImperativeHandle(
    ref,
    () => ({ seekTo: (to) => jumpRef.current?.(to) }),
    []
  )

  // A layout effect, so nothing paints in its initial place before the first frame
  useLayoutEffect(() => {
    const draw = setup()
    if (!draw) return

    const render = (at: number) => {
      draw(at)
      latest.current.onReadout(latest.current.model.readoutAt(at))
      latest.current.onProgress?.(at)
    }

    let progress = latest.current.initialProgress
    jumpRef.current = (to) => {
      progress = to
      render(to)
    }

    render(progress)

    let frame = 0
    let previousTime: number | undefined
    const animate = (time: number) => {
      previousTime ??= time

      if (!latest.current.paused) {
        progress = (progress + (time - previousTime) / FLIGHT_DURATION) % 1
        // Text and drawing change in the same frame
        flushSync(() => render(progress))
      }

      previousTime = time
      frame = window.requestAnimationFrame(animate)
    }

    frame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(frame)
  }, deps)
}

const sameReadout = (a: FlightReadout, b: FlightReadout) =>
  (Object.keys(a) as (keyof FlightReadout)[]).every((k) => a[k] === b[k])

/** The readout to show, and the callback that updates it only when a number changes. */
export function useReadout(model: FlightModel, initialProgress: number) {
  const [data, setData] = useState(() => model.readoutAt(initialProgress))
  // The same readout again and again while the numbers stand still: no re-render
  const onReadout = (next: FlightReadout) =>
    setData((prev) => (sameReadout(prev, next) ? prev : next))
  return [data, onReadout] as const
}
