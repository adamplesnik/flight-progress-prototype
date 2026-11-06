import { useEffect, useLayoutEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import type { FlightModel, FlightReadout } from '../data/flightModel'
import type { LabelStep, SceneLayout } from '../data/types'
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

export function AnimatedRoute({
  layout,
  model,
  data,
  onReadout,
  initialProgress,
  paused,
  seek,
}: {
  layout: SceneLayout
  model: FlightModel
  data: FlightReadout
  onReadout: (data: FlightReadout) => void
  initialProgress: number
  paused: boolean
  /** Jump the animation to `to` (0..1); a new `id` triggers a new jump. */
  seek: { to: number; id: number } | null
}) {
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
    let currentStep: LabelStep | undefined

    const applyStep = (step: LabelStep) => {
      currentStep = step
      label.setAttribute('x', String(step.dx))
      label.setAttribute('y', String(step.dy))
      label.setAttribute('width', String(step.w))
      label.setAttribute('height', String(step.h))
      labelBody.classList.toggle('left', step.align === 'left')
      labelBody.classList.toggle('one-row', step.rows === 1)
    }

    // `at` is timeline time (0..1); the marker follows distance flown,
    // so it stays put until take-off and moves slowly while the aircraft is slow.
    const render = (at: number) => {
      const flownShare = model.distanceProgressAt(at)
      const point = route.getPointAtLength(routeLength * flownShare)
      flown.setAttribute('stroke-dasharray', `${flownShare} 1`)
      marker.setAttribute('transform', `translate(${point.x} ${point.y})`)
      const step = layout.labelSteps.reduce((a, b) =>
        b.from <= flownShare ? b : a
      )
      if (step !== currentStep) applyStep(step)
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
        // Text and marker change in the same frame, or the old text flashes at the new spot
        flushSync(() => render(progress))
      }

      previousTime = time
      frame = window.requestAnimationFrame(animate)
    }

    frame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(frame)
  }, [onReadout, initialProgress, model, layout])

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
          <foreignObject ref={labelRef}>
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
