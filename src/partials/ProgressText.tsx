import type { FlightReadout } from '../data/flightModel'

/** Time left and distance left: in a corner, or following the marker. */
export function ProgressText({ data }: { data: FlightReadout }) {
  return (
    <>
      <p className="time-left">
        <span>in</span> {data.remaining}
      </p>
      <div className="distances">
        <p className="distance-primary">{data.km} km</p>
        <p className="distance-secondary">{data.miles} mi</p>
      </div>
    </>
  )
}
