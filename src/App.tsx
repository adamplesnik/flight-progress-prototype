import { Analytics } from '@vercel/analytics/react'
import { useNavigate, useSearchParams } from 'react-router'
import { flightPath, flights, flightTitle } from './data/flights'
import type { Flight } from './data/types'
import { FlightPlayer } from './lib/FlightPlayer'

/**
 * The demo site: the player for the flight in the address, sized to fit the window.
 * ?variant=compact shows the compact variant.
 */
function App({ flight }: { flight: Flight }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const variant = params.get('variant') === 'compact' ? 'compact' : 'map'
  return (
    <main className="demo">
      <title>{`${flightTitle(flight)} · Flight progress prototype`}</title>
      <FlightPlayer
        flight={flight}
        flights={flights}
        onSelectFlight={(f) =>
          navigate({ pathname: flightPath(f), search: params.toString() })
        }
        variant={variant}
        className="demo-player"
      />
      <Analytics />
    </main>
  )
}

export default App
