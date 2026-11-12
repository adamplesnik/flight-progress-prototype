import { Analytics } from '@vercel/analytics/react'
import { useNavigate } from 'react-router'
import { flightPath, flights, flightTitle } from './data/flights'
import type { Flight } from './data/types'
import { FlightPlayer } from './lib/FlightPlayer'

/** The demo site: the player for the flight in the address, sized to fit the window. */
function App({ flight }: { flight: Flight }) {
  const navigate = useNavigate()
  return (
    <main className="flex min-h-dvh w-full flex-col items-center justify-center p-4 text-main">
      <title>{`${flightTitle(flight)} · Flight progress prototype`}</title>
      <FlightPlayer
        flight={flight}
        flights={flights}
        onSelectFlight={(f) => navigate(flightPath(f))}
        className="max-w-5xl lg:w-[min(100vw-32px,(100dvh-160px)*4/3)]"
      />
      <Analytics />
    </main>
  )
}

export default App
