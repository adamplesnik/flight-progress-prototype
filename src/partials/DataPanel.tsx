import type { FlightReadout } from '../data/flightModel'
import type { Orientation } from '../data/types'
import { FlightData } from './FlightData'

/** Progress and flight data, in a bottom row or a right column of the 48px safe zone. */
export function DataPanel({
  data,
  orientation,
}: {
  data: FlightReadout
  orientation: Orientation
}) {
  return (
    <div className={`data-panel ${orientation}`}>
      <div>
        <p className="remaining">
          <span>in</span> {data.remaining}
        </p>
        <div className="distance">
          <p>{data.km} km</p>
          <p>{data.miles} mi</p>
        </div>
      </div>
      <FlightData data={data} />
    </div>
  )
}
