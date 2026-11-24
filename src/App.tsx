import { Analytics } from '@vercel/analytics/react'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { flightPath, flights, flightTitle } from './data/flights'
import type { Flight } from './data/types'
import { FlightPlayer } from './lib/FlightPlayer'
import { Mockup } from './Mockup'

/**
 * The demo site: the player for the flight in the address, sized to fit the window.
 * ?variant=compact shows the compact variant, ?mockup=1 shows it on a screen in a cabin photo,
 * ?night=1 the dark theme, and the cabin at night.
 */
function App({ flight }: { flight: Flight }) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const variant = params.get('variant') === 'compact' ? 'compact' : 'map'
  const mockup = params.has('mockup')
  const night = params.has('night')
  // The page is dark at night too: <body> has the theme's colours
  useEffect(() => {
    if (night) document.body.dataset.theme = 'dark'
    else delete document.body.dataset.theme
  }, [night])

  /** Sets or clears an option in the address, keeping the others */
  const setOption = (name: string, value: string | null) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === null) next.delete(name)
        else next.set(name, value)
        return next
      },
      { replace: true }
    )

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
        theme={night ? 'dark' : undefined}
        toolbar={
          <div className="demo-options">
            <label>
              <input
                type="checkbox"
                checked={variant === 'compact'}
                onChange={(e) =>
                  setOption('variant', e.target.checked ? 'compact' : null)
                }
              />
              Compact
            </label>
            <label>
              <input
                type="checkbox"
                checked={mockup}
                onChange={(e) =>
                  setOption('mockup', e.target.checked ? '1' : null)
                }
              />
              Real world mockup
            </label>
            <label>
              <input
                type="checkbox"
                checked={night}
                onChange={(e) =>
                  setOption('night', e.target.checked ? '1' : null)
                }
              />
              Night mode
            </label>
          </div>
        }
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
