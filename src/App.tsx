import { Analytics } from '@vercel/analytics/react'
import { useNavigate } from 'react-router'
import { flightPath, flights, flightTitle } from './data/flights'
import type { Flight } from './data/types'
import { FlightPlayer } from './lib/FlightPlayer'

/** The demo site: the player for the flight in the address, sized to fit the window. */
function App({ flight }: { flight: Flight }) {
  const navigate = useNavigate()
  return (
    <main className="fp:flex fp:min-h-dvh fp:w-full fp:flex-col fp:items-center fp:justify-center fp:p-4 fp:text-main">
      <title>{`${flightTitle(flight)} · Flight progress prototype`}</title>
      <FlightPlayer
        flight={flight}
        flights={flights}
        onSelectFlight={(f) => navigate(flightPath(f))}
        className="fp:max-w-5xl fp:lg:w-[min(100vw-32px,(100dvh-160px)*4/3)]"
      />
      <Analytics />
    </main>
  )
}

export default App
