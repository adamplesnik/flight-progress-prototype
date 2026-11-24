import { useEffect, useMemo, type Ref } from 'react'
import { createFlightModel } from '../data/flightModel'
import type { Flight } from '../data/types'
import { computeLayout } from '../layout/computeLayout'
import { AnimatedRoute } from './AnimatedRoute'
import { CityCluster } from './CityCluster'
import { CountryNames } from './CountryNames'
import { DataPanel } from './DataPanel'
import { useReadout, type SceneHandle } from './useTimeline'
import { WorldMapView } from './WorldMapView'

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
  const [data, onReadout] = useReadout(model, initialProgress)

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
        onReadout={onReadout}
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
