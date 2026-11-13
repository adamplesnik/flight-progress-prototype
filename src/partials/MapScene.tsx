import { useEffect, useMemo, useState, type Ref } from 'react'
import { createFlightModel, type FlightReadout } from '../data/flightModel'
import type { Flight } from '../data/types'
import { computeLayout } from '../layout/computeLayout'
import { AnimatedRoute, type SceneHandle } from './AnimatedRoute'
import { CityCluster } from './CityCluster'
import { CountryNames } from './CountryNames'
import { DataPanel } from './DataPanel'
import { WorldMapView } from './WorldMapView'

const sameReadout = (a: FlightReadout, b: FlightReadout) =>
  (Object.keys(a) as (keyof FlightReadout)[]).every((k) => a[k] === b[k])

/**
 * The 4:3 map with the flight on it: route, cities and flight data, as wide as its parent. A new flight starts at `initialProgress` again.
 */
export function MapScene({
  flight,
  paused,
  onProgress,
  initialProgress = 0.45,
  showCountryNames = false,
  ref,
}: {
  flight: Flight
  paused: boolean
  /** Called with the timeline position (0..1) whenever it changes */
  onProgress?: (progress: number) => void
  /** Where on the timeline (0..1) the flight starts */
  initialProgress?: number
  showCountryNames?: boolean
  ref?: Ref<SceneHandle>
}) {
  const layout = useMemo(() => computeLayout(flight), [flight])
  const model = useMemo(() => createFlightModel(flight), [flight])
  const [data, setData] = useState(() => model.readoutAt(initialProgress))

  // For whoever adds a flight: what the layout could not do for it
  useEffect(() => {
    if (import.meta.env.DEV)
      for (const warning of layout.warnings)
        console.warn(`${flight.id}: ${warning}`)
  }, [flight, layout])

  return (
    <div className="scene">
      <WorldMapView map={layout.map} />
      {showCountryNames && <CountryNames map={layout.map} />}
      <AnimatedRoute
        ref={ref}
        layout={layout}
        model={model}
        // The same readout again and again while the numbers stand still: no re-render
        onReadout={(next) =>
          setData((prev) => (sameReadout(prev, next) ? prev : next))
        }
        initialProgress={initialProgress}
        paused={paused}
        onProgress={onProgress}
      />
      <CityCluster {...layout.destination} />
      <CityCluster {...layout.origin} />
      <DataPanel data={data} orientation={layout.orientation} />
    </div>
  )
}
