import clsx from 'clsx'
import type { FlightReadout } from '../data/flightModel'
import type { Orientation } from '../data/types'
import { FlightData } from './FlightData'

/**
 * Progress and flight data, in a bottom row or a right column of the 48px safe zone. Sizes
 * follow the scene (cqw), 1024px wide by design.
 */
export function DataPanel({
  data,
  orientation,
}: {
  data: FlightReadout
  orientation: Orientation
}) {
  return (
    <div
      className={clsx(
        'fp:absolute fp:right-[4.6875%] fp:bottom-[6.25%] fp:flex fp:items-end fp:justify-between',
        orientation == 'row'
          ? 'fp:left-[4.6875%] fp:flex-row'
          : 'fp:top-[6.25%] fp:w-[21.484375cqw] fp:flex-col'
      )}
    >
      <div
        className={clsx(
          'fp:flex fp:flex-col fp:gap-[0.78125cqw] fp:leading-none fp:whitespace-nowrap fp:text-main',
          orientation == 'column' && 'fp:items-end'
        )}
      >
        <p className="fp:flex fp:gap-[1.171875cqw] fp:text-[5.078125cqw] fp:font-semibold">
          <span>in</span> {data.remaining}
        </p>
        <div
          className={clsx(
            'fp:flex',
            orientation == 'row'
              ? 'fp:flex-row fp:items-baseline fp:gap-[1.5625cqw]'
              : 'fp:flex-col fp:items-end fp:gap-[0.78125cqw]'
          )}
        >
          <p className="fp:text-[3.515625cqw] fp:font-semibold">{data.km} km</p>
          <p className="fp:text-[3.515625cqw]">{data.miles} mi</p>
        </div>
      </div>
      <FlightData data={data} orientation={orientation} />
    </div>
  )
}
