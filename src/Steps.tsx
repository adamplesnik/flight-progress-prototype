import { useMemo } from 'react'
import type { Orientation } from './data/types'
import { flightById } from './data/flights'
import { computeLayout, LAYOUTS, MARGIN } from './layout/computeLayout'
import { rootProps } from './lib/theme'
import { MapScene } from './partials/MapScene'
import { SCENE } from './partials/scene'

const PANEL_GAP = 16 // the route's area → the data panel's, scene px (see computeLayout)

/** Where the data panel goes, beside or below the route's area, inside the safe zone */
function panelArea(orientation: Orientation) {
  const { area } = LAYOUTS.find((l) => l.orientation === orientation)!
  const right = SCENE.w - MARGIN
  const bottom = SCENE.h - MARGIN
  if (orientation === 'column') {
    const x = area.x + area.w + PANEL_GAP
    return { x, y: MARGIN, width: right - x, height: bottom - MARGIN }
  }
  const y = area.y + area.h + PANEL_GAP
  return { x: MARGIN, y, width: right - MARGIN, height: bottom - y }
}

/**
 * How the scene is laid out, in two steps, for screens/shoot.mjs:
 * /steps?flight=lis-zurich&step=1|2&progress=0.305.
 * 1 the safe zone, the route and the cities, and the room kept for the data panel;
 * 2 the data panel in that room. On the map, and the route in the text colour.
 */
export function Steps() {
  const params = new URLSearchParams(location.search)
  const flight = flightById(params.get('flight') ?? '')
  const step = params.get('step') === '2' ? 2 : 1
  const progress = Number(params.get('progress'))
  const layout = useMemo(() => flight && computeLayout(flight), [flight])
  if (!flight || !layout) return <p data-missing>No such flight</p>

  return (
    <div
      {...rootProps('flight-map map', 'light', `capture steps step-${step}`)}
    >
      <MapScene flight={flight} paused initialProgress={progress} />
      <svg
        className="route-path step-guides"
        viewBox={`0 0 ${SCENE.w} ${SCENE.h}`}
        aria-hidden="true"
      >
        <rect
          className="safe-zone"
          x={MARGIN}
          y={MARGIN}
          width={SCENE.w - 2 * MARGIN}
          height={SCENE.h - 2 * MARGIN}
        />
        {step === 1 && (
          <rect className="panel-area" {...panelArea(layout.orientation)} />
        )}
      </svg>
    </div>
  )
}
