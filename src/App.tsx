import { Analytics } from '@vercel/analytics/react'
import { useNavigate } from 'react-router'
import { flightPath, flights, flightTitle } from './data/flights'
import type { Flight } from './data/types'
import { FlightPlayer } from './lib/FlightPlayer'

/** The demo site: the player for the flight in the address, sized to fit the window. */
function App({ flight }: { flight: Flight }) {
  const navigate = useNavigate()
  return (
    <main className="demo">
      <title>{`${flightTitle(flight)} · Flight progress prototype`}</title>
      <FlightPlayer
        flight={flight}
        flights={flights}
        onSelectFlight={(f) => navigate(flightPath(f))}
        className="demo-player"
      />
      <Analytics />
    </main>
  )
}

export default App
