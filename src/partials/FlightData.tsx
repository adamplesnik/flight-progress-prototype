import type { FlightReadout } from '../data/flightModel'
import type { Corner, Orientation } from '../data/types'
import { cornerClasses } from './scene'

export function FlightData({
  data,
  corner,
  orientation,
}: {
  data: FlightReadout
  corner: Corner
  orientation: Orientation
}) {
  return (
    <dl
      className={`flight-data ${orientation} ${cornerClasses(corner)}`}
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
