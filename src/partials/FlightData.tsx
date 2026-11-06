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
        'flex items-start gap-[3.125cqw] text-[3.125cqw] leading-none whitespace-nowrap',
        orientation == 'row' ? 'flex-row' : 'flex-col'
      )}
      aria-label="Current flight conditions"
    >
      {rows.map(([value, unit, other, otherUnit]) => (
        <div
          key={unit}
          className={clsx(
            'flex w-[14.6484375cqw] flex-col gap-[0.390625cqw]',
            orientation == 'row'
              ? 'items-start last:w-[9.765625cqw]'
              : 'items-end'
          )}
        >
          <dt className="flex items-center justify-center gap-[0.5859375cqw] font-semibold">
            {value} <span>{unit}</span>
          </dt>
          <dd className="flex items-center justify-center gap-[0.78125cqw]">
            {other} <span>{otherUnit}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}
