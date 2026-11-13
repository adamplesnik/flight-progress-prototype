import type { FlightReadout } from '../data/flightModel'

export function FlightData({ data }: { data: FlightReadout }) {
  const rows = [
    [data.kmh, 'km/h', data.mph, 'mph'],
    [data.meters, 'm', data.feet, 'ft'],
    [data.celsius, '°C', data.fahrenheit, '°F'],
  ]
  return (
    <dl className="conditions" aria-label="Current flight conditions">
      {rows.map(([value, unit, other, otherUnit]) => (
        <div key={unit}>
          <dt>
            {value} <span>{unit}</span>
          </dt>
          <dd>
            {other} <span>{otherUnit}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}
