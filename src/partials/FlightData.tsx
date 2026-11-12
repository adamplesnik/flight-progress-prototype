import clsx from 'clsx'
import type { FlightReadout } from '../data/flightModel'
import type { Orientation } from '../data/types'

export function FlightData({
  data,
  orientation,
}: {
  data: FlightReadout
  orientation: Orientation
}) {
  const rows = [
    [data.kmh, 'km/h', data.mph, 'mph'],
    [data.meters, 'm', data.feet, 'ft'],
    [data.celsius, '°C', data.fahrenheit, '°F'],
  ]
  return (
    <dl
      className={clsx(
        'fp:flex fp:items-start fp:gap-[3.125cqw] fp:text-[3.125cqw] fp:leading-none fp:whitespace-nowrap',
        orientation == 'row' ? 'fp:flex-row' : 'fp:flex-col'
      )}
      aria-label="Current flight conditions"
    >
      {rows.map(([value, unit, other, otherUnit]) => (
        <div
          key={unit}
          className={clsx(
            'fp:flex fp:w-[14.6484375cqw] fp:flex-col fp:gap-[0.390625cqw]',
            orientation == 'row'
              ? 'fp:items-start fp:last:w-[9.765625cqw]'
              : 'fp:items-end'
          )}
        >
          <dt className="fp:flex fp:items-center fp:justify-center fp:gap-[0.5859375cqw] fp:font-semibold">
            {value} <span>{unit}</span>
          </dt>
          <dd className="fp:flex fp:items-center fp:justify-center fp:gap-[0.78125cqw]">
            {other} <span>{otherUnit}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}
