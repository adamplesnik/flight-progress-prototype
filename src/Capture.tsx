import { flightById } from './data/flights'
import { FlightMap } from './lib/FlightMap'

/**
 * One flight's map, held at one position and 1024px wide, for screens/shoot.mjs:
 * /capture?flight=lis-zurich&progress=0.305, and &variant=compact for the compact one
 */
export function Capture() {
  const params = new URLSearchParams(location.search)
  const flight = flightById(params.get('flight') ?? '')
  if (!flight) return <p data-missing>No such flight</p>
  return (
    <FlightMap
      flight={flight}
      progress={Number(params.get('progress'))}
      variant={params.get('variant') === 'compact' ? 'compact' : 'map'}
      theme="light"
      className="capture"
    />
  )
}
