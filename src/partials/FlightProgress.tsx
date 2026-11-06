import { useCallback, useMemo, useState } from 'react'
import { createFlightModel, type FlightReadout } from '../data/flightModel'
import type { Flight, SceneLayout } from '../data/types'
import { AnimatedRoute } from './AnimatedRoute'
import { CityCluster } from './CityCluster'
import { FlightData } from './FlightData'
import { cornerClasses } from './scene'

const INITIAL_PROGRESS = 0.2

const sameReadout = (a: FlightReadout, b: FlightReadout) =>
  (Object.keys(a) as (keyof FlightReadout)[]).every((k) => a[k] === b[k])

/** Everything in the scene that follows the flight. Render with `key={flight.id}`. */
export function FlightProgress({
  flight,
  layout,
  paused,
  seek,
}: {
  flight: Flight
  layout: SceneLayout
  paused: boolean
  seek: { to: number; id: number } | null
}) {
  const model = useMemo(() => createFlightModel(flight), [flight])
  const [data, setData] = useState(() => model.readoutAt(INITIAL_PROGRESS))
  const onReadout = useCallback((next: FlightReadout) => {
    setData((prev) => (sameReadout(prev, next) ? prev : next))
  }, [])

  return (
    <>
      <AnimatedRoute
        layout={layout}
        model={model}
        onReadout={onReadout}
        initialProgress={INITIAL_PROGRESS}
        paused={paused}
        seek={seek}
      />
      <CityCluster {...layout.destination} />
      <CityCluster {...layout.origin} />
      <FlightData data={data} {...layout.flightData} />
      <div
        className={`progress-block ${layout.progress.rows === 1 ? 'one-row' : ''} ${cornerClasses(layout.progress.corner)}`}
      >
        <p className="time-left">
          <span>in</span> {data.remaining}
        </p>
        <div className="distances">
          <p className="distance-primary">{data.km} km</p>
          <p className="distance-secondary">{data.miles} mi</p>
        </div>
      </div>
    </>
  )
}
