import { useEffect, useRef } from 'react'
import type { FlightModel, FlightReadout } from '../data/flightModel'
import type { Box, Endpoint, Flight } from '../data/types'
import { placeLabel, type Point, type Rect } from './labelPlacement'

const boxStyle = ({ left, top, width, height }: Box) => ({
  left: `${left}%`,
  top: `${top}%`,
  width: `${width}%`,
  height: `${height}%`,
})
// Route dash pattern (px)
const dashLength = 28
const dashGap = 30
// Progress label (cities-below layout): size, and the safe zone it must stay inside
const LABEL_SIZE = { w: 200, h: 140 }
const SAFE_MARGIN = 48
const SCENE = { w: 1024, h: 768 }
// Rough size of a city cluster (dot + text) used to keep the label away from it
function clusterRect(e: Endpoint, placement: 'above' | 'below'): Rect {
  const x = (e.dot.left / 100) * SCENE.w
  const y = (e.dot.top / 100) * SCENE.h
  const w = Math.max(e.city.length * 31, e.label.length * 20)
  const left = e.align === 'end' ? x + 24 - w : x - 24
  const top = placement === 'below' ? y - 24 : y - 24 - 16 - 96
  return { x: left, y: top, w, h: 24 + 16 + 96 + 24 }
}
// Length of one full animation loop (ms)
const flightDuration = 40000

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
  const labelAbove = flight.layout === 'cities-below'
  const viewBox = `0 0 ${flight.route.viewBox.width} ${flight.route.viewBox.height}`
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

  useEffect(() => {
    const route = routeRef.current
    const flown = flownRef.current
    const marker = markerRef.current

    if (!route || !flown || !marker) return

    const routeLength = route.getTotalLength()
    const label = labelRef.current
    const labelBody = labelBodyRef.current

    // Dynamic label placement (cities-below layout): needs the route as points
    const path: Point[] = []
    for (let d = 0; d <= routeLength; d += 4) {
      const { x, y } = route.getPointAtLength(d)
      path.push({ x, y })
    }
    const obstacles = [flight.origin, flight.destination].map((e) =>
      clusterRect(e, 'below')
    )
    const bounds: Rect = {
      x: SAFE_MARGIN,
      y: SAFE_MARGIN,
      w: SCENE.w - 2 * SAFE_MARGIN,
      h: SCENE.h - 2 * SAFE_MARGIN,
    }

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
      const flownShare = model.distanceProgressAt(progress)
      const point = route.getPointAtLength(routeLength * flownShare)
      flown.setAttribute('stroke-dasharray', `${flownShare} 1`)
      marker.setAttribute('transform', `translate(${point.x} ${point.y})`)
      if (labelAbove && label && labelBody) {
        const { rect, side, align } = placeLabel({
          marker: point,
          size: LABEL_SIZE,
          prefer: 'above',
          path,
          pathMargin: 20,
          obstacles,
          bounds,
        })
        label.setAttribute('x', String(rect.x - point.x))
        label.setAttribute('y', String(rect.y - point.y))
        labelBody.classList.toggle('above', side === 'above')
        labelBody.classList.toggle('left', align === 'left')
      }
      onReadout(model.readoutAt(progress))
    }

    jumpRef.current = (to) => {
      progress = to
      renderProgress(to)
    }

    // Place the marker right away so it never sits at the SVG origin before the first frame
    renderProgress(initialProgress)
    if (reducedMotion) return

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
  }, [onReadout, initialProgress, model, flight, labelAbove])

  return (
    <>
      <svg
        className="route-path route-lines"
        style={boxStyle(flight.route.box)}
        viewBox={viewBox}
        fill="none"
        aria-hidden="true"
      >
        <path
          ref={routeRef}
          className="route-segment route-remaining"
          d={flight.route.geometry}
        />
        <path
          ref={flownRef}
          className="route-segment route-flown"
          d={flight.route.geometry}
          pathLength="1"
          strokeDasharray="0 1"
        />
      </svg>
      <svg
        className="route-path marker-layer"
        style={boxStyle(flight.route.box)}
        viewBox={viewBox}
        fill="none"
        overflow="visible"
        aria-hidden="true"
      >
        <g ref={markerRef} className="flight-marker">
          <foreignObject
            ref={labelRef}
            x={labelAbove ? -LABEL_SIZE.w + 24 : -150}
            y={labelAbove ? -176 : 40}
            width={labelAbove ? LABEL_SIZE.w : 174}
            height={labelAbove ? LABEL_SIZE.h : 150}
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
