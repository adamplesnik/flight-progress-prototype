import { useMemo, useRef, type CSSProperties, type Ref } from 'react'
import { createFlightModel } from '../data/flightModel'
import type { City, Flight } from '../data/types'
import { textWidth } from '../layout/textMetrics'
import { FlightData } from './FlightData'
import { IconArrowRight } from './icons'
import { useReadout, useTimeline, type SceneHandle } from './useTimeline'

/**
 * Design size of the compact scene, 3:2, in px; style.css has the same sizes. Text is in
 * these px too, as large as the small screen allows.
 */
const COMPACT = { w: 1152, margin: 56, textX: 188 }
const CITY_SIZE = 76
const TIME_SIZE = 50
const ARROW_W = 58 // the time's arrow icon, 46px, and its 12px gap
// The flight data column at the right, as wide as "1,000 km/h", and a 40px gap before it.
// It is level with the origin's time and the destination's name.
const DATA_W = 320

/** The largest font size up to `CITY_SIZE` at which the city's name and time fit. */
function citySize({ city, time }: City, nameWidth: number, timeWidth: number) {
  const nameScale = nameWidth / textWidth(city, CITY_SIZE, 600)
  const timeScale = timeWidth / (textWidth(time, TIME_SIZE, 600) + ARROW_W)
  return Math.floor(CITY_SIZE * Math.min(1, nameScale, timeScale))
}

function CompactCity({
  city,
  isDestination,
  nameWidth,
  timeWidth,
}: {
  city: City
  isDestination: boolean
  nameWidth: number
  timeWidth: number
}) {
  const size = citySize(city, nameWidth, timeWidth)
  return (
    <section
      className={`compact-city ${isDestination ? 'destination' : 'origin'}`}
      style={
        size < CITY_SIZE
          ? ({ '--city-size': size } as CSSProperties)
          : undefined
      }
    >
      <h1>{city.city}</h1>
      <p>
        {city.time}
        <IconArrowRight strokeWidth="3" />
      </p>
    </section>
  )
}

/**
 * For small screens: no map, only a straight track from the origin at the top to the
 * destination at the bottom, with large text. 3:2, as wide as its parent.
 */
export function CompactScene({
  flight,
  paused,
  onProgress,
  initialProgress = 0.45,
  ref,
}: {
  flight: Flight
  paused: boolean
  onProgress?: (progress: number) => void
  initialProgress?: number
  ref?: Ref<SceneHandle>
}) {
  const model = useMemo(() => createFlightModel(flight), [flight])
  const [data, onReadout] = useReadout(model, initialProgress)
  const sceneRef = useRef<HTMLDivElement>(null)

  // The track and marker follow the share of the distance flown, through --flown
  useTimeline(
    { model, onReadout, initialProgress, paused, onProgress, ref },
    () => {
      const scene = sceneRef.current
      if (!scene) return
      return (at) =>
        scene.style.setProperty(
          '--flown',
          model.distanceProgressAt(at).toFixed(4)
        )
    },
    [model]
  )

  // From the text's left edge to the margin on the right
  const copyWidth = COMPACT.w - COMPACT.margin - COMPACT.textX
  return (
    <div ref={sceneRef} className="compact-scene">
      <div className="track" aria-hidden="true">
        <span className="track-remaining" />
        <span className="track-flown" />
        <span className="route-dot start" />
        <span className="route-dot end" />
        <span className="track-marker" />
      </div>
      <CompactCity
        city={flight.origin}
        isDestination={false}
        nameWidth={copyWidth}
        timeWidth={copyWidth - DATA_W}
      />
      <CompactCity
        city={flight.destination}
        isDestination={true}
        nameWidth={copyWidth - DATA_W}
        timeWidth={copyWidth}
      />
      <div className="compact-progress">
        <p className="remaining">
          <span>in</span> {data.remaining}
        </p>
        <p className="km">{data.km} km</p>
        <p>{data.miles} mi</p>
      </div>
      <FlightData data={data} />
    </div>
  )
}
