import { useCallback, useMemo, useState } from 'react'
import { createFlightModel, type FlightReadout } from '../data/flightModel'
import type { Flight } from '../data/types'
import { AnimatedRoute } from './AnimatedRoute'
import { CityCluster } from './CityCluster'
import { FlightData } from './FlightData'
import { LocalTime } from './LocalTime'

const INITIAL_PROGRESS = 0.2

const sameReadout = (a: FlightReadout, b: FlightReadout) =>
  (Object.keys(a) as (keyof FlightReadout)[]).every((k) => a[k] === b[k])

/** Everything in the scene that follows the flight. Render with `key={flight.id}`. */
export function FlightProgress({
  flight,
  paused,
  seek,
}: {
  flight: Flight
  paused: boolean
  seek: { to: number; id: number } | null
}) {
  const model = useMemo(() => createFlightModel(flight), [flight])
  const [data, setData] = useState(() => model.readoutAt(INITIAL_PROGRESS))
  const onReadout = useCallback((next: FlightReadout) => {
    setData((prev) => (sameReadout(prev, next) ? prev : next))
  }, [])

  const citiesBelow = flight.layout === 'cities-below'
  const placement = citiesBelow ? 'below' : 'above'

  return (
    <>
      <AnimatedRoute
        flight={flight}
        model={model}
        data={data}
        onReadout={onReadout}
        initialProgress={INITIAL_PROGRESS}
        paused={paused}
        seek={seek}
      />
      <CityCluster {...flight.destination} placement={placement} />
      <CityCluster {...flight.origin} placement={placement} />
      <FlightData data={data} bottom={citiesBelow} />
      <LocalTime clock={data.clock} />
    </>
  )
}
