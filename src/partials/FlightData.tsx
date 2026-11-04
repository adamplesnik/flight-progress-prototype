import type { FlightReadout } from '../data/flightModel'

export function FlightData({
  data,
  bottom = false,
}: {
  data: FlightReadout
  bottom?: boolean
}) {
  return (
    <dl
      className={bottom ? 'flight-data bottom' : 'flight-data'}
      aria-label="Current flight conditions"
    >
      <div>
        <dt>
          {data.kmh} <span>km/h</span>
        </dt>
        <dd>
          {data.mph} <span>mph</span>
        </dd>
      </div>
      <div>
        <dt>
          {data.meters} <span>m</span>
        </dt>
        <dd>
          {data.feet} <span>ft</span>
        </dd>
      </div>
      <div>
        <dt>
          {data.celsius} <span>°C</span>
        </dt>
        <dd>
          {data.fahrenheit} <span>°F</span>
        </dd>
      </div>
    </dl>
  )
}
