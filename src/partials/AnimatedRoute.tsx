import { useEffect, useRef } from 'react'
import {
  distanceProgressAt,
  readoutAt,
  type FlightReadout,
} from '../data/flightData'

const routeGeometry =
  'M596.4 359.9 C588.2 363.2 569 366.4 543.9 359.8 C513.4 351.8 439.4 311.8 383.4 277.3 C365 266 338 245 312.2 225 C264.3 186.6 215.6 149 166.3 112.2 C116.5 76.1 66.6 40.2 -11.6 -4.1'
// Route dash pattern (px)
const dashLength = 28
const dashGap = 30
// Length of one full animation loop (ms)
const flightDuration = 40000

export function AnimatedRoute({
  data,
  onReadout,
  initialProgress,
  paused,
  seek,
}: {
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
  const pausedRef = useRef(paused)
  const jumpRef = useRef<(to: number) => void>(undefined)

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    if (seek) jumpRef.current?.(seek.to)
  }, [seek])

  useEffect(() => {
    const route = routeRef.current
    const flown = flownRef.current
    const marker = markerRef.current

    if (!route || !flown || !marker) return

    const routeLength = route.getTotalLength()

    // Fit the dash pattern so the first and last dash both sit half inside the
    // departure/arrival dots: dashes span 10px..(length - 10px) of the route (dot
    // radius 24px, dash 28px). The gap is stretched slightly so it divides evenly.
    const dashInset = 10
    const span = routeLength - 2 * dashInset - dashLength
    const dashCount = Math.max(1, Math.round(span / (dashLength + dashGap)))
    const fittedGap = span / dashCount - dashLength
    route.setAttribute('stroke-dasharray', `${dashLength} ${fittedGap}`)
    route.setAttribute('stroke-dashoffset', String(-dashInset))
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    let frame = 0
    let previousTime: number | undefined
    let progress = initialProgress

    // `progress` is timeline time (0..1); the marker follows distance flown,
    // so it stays put until take-off and moves slowly while the aircraft is slow.
    const renderProgress = (progress: number) => {
      const flownShare = distanceProgressAt(progress)
      const point = route.getPointAtLength(routeLength * flownShare)
      flown.setAttribute('stroke-dasharray', `${flownShare} 1`)
      marker.setAttribute('transform', `translate(${point.x} ${point.y})`)
      onReadout(readoutAt(progress))
    }

    jumpRef.current = (to) => {
      progress = to
      renderProgress(to)
    }

    if (reducedMotion) {
      renderProgress(initialProgress)
      return
    }

    const animate = (time: number) => {
      previousTime ??= time

      if (!pausedRef.current) {
        progress = (progress + (time - previousTime) / flightDuration) % 1
        renderProgress(progress)
      }

      previousTime = time
      frame = window.requestAnimationFrame(animate)
    }

    frame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(frame)
  }, [onReadout, initialProgress])

  return (
    <>
      <svg
        className="route-path route-lines"
        viewBox="0 0 598.472 383.641"
        fill="none"
        aria-hidden="true"
      >
        <path
          ref={routeRef}
          className="route-segment route-remaining"
          d={routeGeometry}
        />
        <path
          ref={flownRef}
          className="route-segment route-flown"
          d={routeGeometry}
          pathLength="1"
          strokeDasharray="0 1"
        />
      </svg>
      <svg
        className="route-path marker-layer"
        viewBox="0 0 598.472 383.641"
        fill="none"
        overflow="visible"
        aria-hidden="true"
      >
        <g ref={markerRef} className="flight-marker">
          <foreignObject x="-150" y="40" width="174" height="150">
            <div className="marker-data">
              <p className="time-left">
                <span>in</span> {data.remaining}
              </p>
              <p className="distance-primary">{data.km} km</p>
              <p className="distance-secondary">{data.miles} mi</p>
            </div>
          </foreignObject>
          <circle r="18" />
        </g>
      </svg>
    </>
  )
}
