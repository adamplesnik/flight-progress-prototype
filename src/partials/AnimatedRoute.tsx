import { useImperativeHandle, useLayoutEffect, useRef, type Ref } from 'react'
import { flushSync } from 'react-dom'
import type { FlightModel, FlightReadout } from '../data/flightModel'
import type { SceneLayout } from '../data/types'
import { SCENE } from './scene'

const VIEW_BOX = `0 0 ${SCENE.w} ${SCENE.h}`
// Length of one full animation loop (ms)
const FLIGHT_DURATION = 40000
// Route dash pattern (px)
const DASH_LENGTH = 28
const DASH_GAP = 30
const DASH_INSET = 10

/**
 * Fits the dash pattern so the first and last dash both sit half inside the
 * departure/arrival dots: dashes span 10px..(length - 10px) of the route (dot
 * radius 24px, dash 28px). The gap is stretched slightly so it divides evenly.
 */
function fitDashes(route: SVGPathElement) {
  const span = route.getTotalLength() - 2 * DASH_INSET - DASH_LENGTH
  const count = Math.max(1, Math.round(span / (DASH_LENGTH + DASH_GAP)))
  route.setAttribute(
    'stroke-dasharray',
    `${DASH_LENGTH} ${span / count - DASH_LENGTH}`
  )
  route.setAttribute('stroke-dashoffset', String(-DASH_INSET))
}

/** Share of the drawn route at a share of the real distance flown (both 0..1). */
function pathShareAt(
  { path, geo }: SceneLayout['routeShares'],
  flownShare: number
) {
  let i = 1
  while (i < geo.length - 1 && geo[i] < flownShare) i++
  const span = geo[i] - geo[i - 1]
  const t = span > 0 ? (flownShare - geo[i - 1]) / span : 0
  return path[i - 1] + (path[i] - path[i - 1]) * Math.min(Math.max(t, 0), 1)
}

/** What a parent can do to the scene through its ref */
export type SceneHandle = {
  /** Jump to this point of the timeline (0..1) */
  seekTo: (progress: number) => void
}

export function AnimatedRoute({
  layout,
  model,
  onReadout,
  initialProgress,
  paused,
  onProgress,
  ref,
}: {
  layout: SceneLayout
  model: FlightModel
  onReadout: (data: FlightReadout) => void
  /** Where the flight starts (0..1), and starts again when the flight changes */
  initialProgress: number
  paused: boolean
  /** Called with the timeline position (0..1) whenever it changes. */
  onProgress?: (progress: number) => void
  ref?: Ref<SceneHandle>
}) {
  const routeRef = useRef<SVGPathElement>(null)
  const flownRef = useRef<SVGPathElement>(null)
  const markerRef = useRef<SVGGElement>(null)
  const jumpRef = useRef<(to: number) => void>(undefined)
  // The animation reads these as they are now, so a new callback or value does not restart it
  const latest = useRef({ onReadout, onProgress, initialProgress, paused })
  useLayoutEffect(() => {
    latest.current = { onReadout, onProgress, initialProgress, paused }
  })

  useImperativeHandle(
    ref,
    () => ({ seekTo: (to) => jumpRef.current?.(to) }),
    []
  )

  // A layout effect, so the marker never paints at the SVG origin before the first frame
  useLayoutEffect(() => {
    const route = routeRef.current
    const flown = flownRef.current
    const marker = markerRef.current

    if (!route || !flown || !marker) return

    fitDashes(route)
    const routeLength = route.getTotalLength()

    // `at` is timeline time (0..1); the marker follows distance flown,
    // so it stays put until take-off and moves slowly while the aircraft is slow.
    const render = (at: number) => {
      const flownShare = pathShareAt(
        layout.routeShares,
        model.distanceProgressAt(at)
      )
      const point = route.getPointAtLength(routeLength * flownShare)
      flown.setAttribute('stroke-dasharray', `${flownShare} 1`)
      marker.setAttribute('transform', `translate(${point.x} ${point.y})`)
      latest.current.onReadout(model.readoutAt(at))
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
        // Text and marker change in the same frame
        flushSync(() => render(progress))
      }

      previousTime = time
      frame = window.requestAnimationFrame(animate)
    }

    frame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(frame)
  }, [model, layout])

  return (
    <>
      <svg
        className="route-path route-lines"
        viewBox={VIEW_BOX}
        aria-hidden="true"
      >
        <path ref={routeRef} className="route-segment" d={layout.route} />
        <path
          ref={flownRef}
          className="route-segment"
          d={layout.route}
          pathLength="1"
          strokeDasharray="0 1"
        />
      </svg>
      <svg
        className="route-path marker-layer"
        viewBox={VIEW_BOX}
        aria-hidden="true"
      >
        <g ref={markerRef} className="flight-marker">
          <circle r="18" />
        </g>
      </svg>
    </>
  )
}
