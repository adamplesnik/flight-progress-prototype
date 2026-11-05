import { useEffect, useLayoutEffect, useRef } from 'react'
import type { FlightModel, FlightReadout } from '../data/flightModel'
import type { Flight } from '../data/types'
import { createLabelPlacer, LABEL_SIZE } from './labelPlacement'
import { SCENE } from './scene'

const VIEW_BOX = `0 0 ${SCENE.w} ${SCENE.h}`
// Length of one full animation loop (ms)
const FLIGHT_DURATION = 40000
// Route dash pattern (px)
const DASH_LENGTH = 28
const DASH_GAP = 30
const DASH_INSET = 10
// Progress label box, relative to the marker
const FIXED_LABEL = { x: -150, y: 40, width: 174, height: 150 }
const PLACED_LABEL = { x: 0, y: 0, width: LABEL_SIZE.w, height: LABEL_SIZE.h }

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

export function AnimatedRoute({
  flight,
  model,
  data,
  onReadout,
  initialProgress,
  paused,
  seek,
}: {
  flight: Flight
  model: FlightModel
  data: FlightReadout
  onReadout: (data: FlightReadout) => void
  initialProgress: number
  paused: boolean
  /** Jump the animation to `to` (0..1); a new `id` triggers a new jump. */
  seek: { to: number; id: number } | null
}) {
  // Only the 'cities-below' layout places its label dynamically
  const placesLabel = flight.layout === 'cities-below'
  const routeRef = useRef<SVGPathElement>(null)
  const flownRef = useRef<SVGPathElement>(null)
  const markerRef = useRef<SVGGElement>(null)
  const labelRef = useRef<SVGForeignObjectElement>(null)
  const labelBodyRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(paused)
  const jumpRef = useRef<(to: number) => void>(undefined)

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    if (seek) jumpRef.current?.(seek.to)
  }, [seek])

  // A layout effect, so the marker never paints at the SVG origin before the first frame
  useLayoutEffect(() => {
    const route = routeRef.current
    const flown = flownRef.current
    const marker = markerRef.current
    const label = labelRef.current
    const labelBody = labelBodyRef.current

    if (!route || !flown || !marker || !label || !labelBody) return

    fitDashes(route)
    const routeLength = route.getTotalLength()
    const placeLabel = placesLabel
      ? createLabelPlacer(route, [flight.origin, flight.destination])
      : null

    // `at` is timeline time (0..1); the marker follows distance flown,
    // so it stays put until take-off and moves slowly while the aircraft is slow.
    const render = (at: number) => {
      const flownShare = model.distanceProgressAt(at)
      const point = route.getPointAtLength(routeLength * flownShare)
      flown.setAttribute('stroke-dasharray', `${flownShare} 1`)
      marker.setAttribute('transform', `translate(${point.x} ${point.y})`)
      if (placeLabel) {
        const { rect, side, align } = placeLabel(point)
        label.setAttribute('x', String(rect.x - point.x))
        label.setAttribute('y', String(rect.y - point.y))
        labelBody.classList.toggle('above', side === 'above')
        labelBody.classList.toggle('left', align === 'left')
      }
      onReadout(model.readoutAt(at))
    }

    let progress = initialProgress
    jumpRef.current = (to) => {
      progress = to
      render(to)
    }

    render(progress)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    let previousTime: number | undefined
    const animate = (time: number) => {
      previousTime ??= time

      if (!pausedRef.current) {
        progress = (progress + (time - previousTime) / FLIGHT_DURATION) % 1
        render(progress)
      }

      previousTime = time
      frame = window.requestAnimationFrame(animate)
    }

    frame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(frame)
  }, [onReadout, initialProgress, model, flight, placesLabel])

  return (
    <>
      <svg
        className="route-path route-lines"
        viewBox={VIEW_BOX}
        aria-hidden="true"
      >
        <path ref={routeRef} className="route-segment" d={flight.route} />
        <path
          ref={flownRef}
          className="route-segment"
          d={flight.route}
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
          <foreignObject
            ref={labelRef}
            {...(placesLabel ? PLACED_LABEL : FIXED_LABEL)}
          >
            <div ref={labelBodyRef} className="marker-data">
              <p className="time-left">
                <span>in</span> {data.remaining}
              </p>
              <div className="distances">
                <p className="distance-primary">{data.km} km</p>
                <p className="distance-secondary">{data.miles} mi</p>
              </div>
            </div>
          </foreignObject>
          <circle r="18" />
        </g>
      </svg>
    </>
  )
}
