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
        'absolute right-[4.6875%] bottom-[6.25%] flex items-end justify-between',
        orientation == 'row'
          ? 'left-[4.6875%] flex-row'
          : 'top-[6.25%] w-[21.484375cqw] flex-col'
      )}
    >
      <div
        className={clsx(
          'flex flex-col gap-[0.78125cqw] leading-none whitespace-nowrap text-[#090909]',
          orientation == 'column' && 'items-end'
        )}
      >
        <p className="flex gap-[1.171875cqw] text-[5.078125cqw] font-semibold">
          <span>in</span> {data.remaining}
        </p>
        <div
          className={clsx(
            'flex',
            orientation == 'row'
              ? 'flex-row items-baseline gap-[1.5625cqw]'
              : 'flex-col items-end gap-[0.78125cqw]'
          )}
        >
          <p className="text-[3.515625cqw] font-semibold">{data.km} km</p>
          <p className="text-[3.515625cqw]">{data.miles} mi</p>
        </div>
      </div>
      <FlightData data={data} orientation={orientation} />
    </div>
  )
}
