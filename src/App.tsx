import { Analytics } from '@vercel/analytics/react'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { flightPath, flights, flightTitle } from './data/flights'
import type { Flight } from './data/types'
import { DemoOptions, useDemoOptions } from './DemoOptions'
import { FlightPlayer } from './lib/FlightPlayer'
import { Mockup } from './Mockup'

/**
 * The demo site: the player for the flight in the address, sized to fit the window, with
 * options for the compact variant, a cabin photo around it, and night mode.
 */
function App({ flight }: { flight: Flight }) {
  const navigate = useNavigate()
  const { search } = useLocation()
  const [options, setOption] = useDemoOptions()
  const { mockup, night } = options
  const variant = options.compact ? 'compact' : 'map'

  // The page is dark at night too: <body> has the theme's colours
  useEffect(() => {
    if (night) document.body.dataset.theme = 'dark'
    else delete document.body.dataset.theme
  }, [night])

  return (
    <main className="demo">
      <title>{`${flightTitle(flight)} · Flight progress prototype`}</title>
      <FlightPlayer
        flight={flight}
        flights={flights}
        // Another flight, the same options
        onSelectFlight={(f) => navigate({ pathname: flightPath(f), search })}
        variant={variant}
        theme={night ? 'dark' : undefined}
        toolbar={<DemoOptions options={options} onChange={setOption} />}
        frame={
          mockup
            ? (scene) => (
                <Mockup variant={variant} night={night}>
                  {scene}
                </Mockup>
              )
            : undefined
        }
        className={`demo-player ${mockup ? 'with-mockup' : ''}`}
      />
      <Analytics />
    </main>
  )
}

export default App
