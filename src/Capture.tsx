import { flightById } from './data/flights'
import { FlightMap } from './lib/FlightMap'

/**
 * One flight's map, held at one position and 1024px wide, for screens/shoot.mjs:
 * /capture?flight=LPPT-LSZH&progress=0.305
 */
export function Capture() {
  const params = new URLSearchParams(location.search)
  const flight = flightById(params.get('flight') ?? '')
  if (!flight) return <p data-missing>No such flight</p>
  return (
    <div className="fp:w-[1024px]">
      <FlightMap
        flight={flight}
        progress={Number(params.get('progress'))}
        theme="light"
      />
    </div>
  )
}
