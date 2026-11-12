import { useMemo } from 'react'
import type { Flight } from '../data/types'
import { computeLayout } from '../layout/computeLayout'
import { CountryNames } from './CountryNames'
import { FlightProgress } from './FlightProgress'
import { WorldMapView } from './WorldMapView'

/** The 4:3 map with the flight on it; it fills its parent, which sets the size. */
export function MapScene({
  flight,
  paused,
  seek,
  onProgress,
  initialProgress,
  showCountryNames = false,
}: {
  flight: Flight
  paused: boolean
  seek: { to: number; id: number } | null
  onProgress: (progress: number) => void
  initialProgress?: number
  showCountryNames?: boolean
}) {
  const layout = useMemo(() => computeLayout(flight), [flight])
  return (
    <div className="scene">
      <WorldMapView map={layout.map} />
      {showCountryNames && <CountryNames map={layout.map} />}
      <FlightProgress
        key={flight.id}
        flight={flight}
        layout={layout}
        paused={paused}
        seek={seek}
        onProgress={onProgress}
        initialProgress={initialProgress}
      />
    </div>
  )
}
