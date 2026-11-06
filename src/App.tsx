import { useMemo, useState } from 'react'
import { defaultFlight, flights } from './data/flights'
import { computeLayout } from './layout/computeLayout'
import { CountryNames } from './partials/CountryNames'
import { FlightProgress } from './partials/FlightProgress'
import { Header } from './partials/Header'
import { WorldMapView } from './partials/WorldMapView'

function App() {
  const [flightId, setFlightId] = useState(defaultFlight.id)
  const flight = flights.find((f) => f.id === flightId) ?? defaultFlight
  const [paused, setPaused] = useState(false)
  // Country names on the map (toggle in the header)
  const [showCountryNames, setShowCountryNames] = useState(false)
  const [seek, setSeek] = useState<{ to: number; id: number } | null>(null)
  const layout = useMemo(() => computeLayout(flight), [flight])

  const selectFlight = (id: string) => {
    setFlightId(id)
    setSeek(null)
  }

  return (
    <main className="wrapper">
      <Header
        flight={flight}
        onSelectFlight={selectFlight}
        paused={paused}
        onToggle={() => setPaused((p) => !p)}
        showCountryNames={showCountryNames}
        onToggleCountryNames={() => setShowCountryNames((v) => !v)}
        onSeek={(to) => setSeek((prev) => ({ to, id: (prev?.id ?? 0) + 1 }))}
      />
      <div className="flight-map max-w-5xl rounded-xl border border-gray-300">
        <div className="scene">
          <WorldMapView map={layout.map} />
          {showCountryNames && <CountryNames map={layout.map} />}
          <FlightProgress
            key={flight.id}
            flight={flight}
            layout={layout}
            paused={paused}
            seek={seek}
          />
          <div
            className="pointer-events-none absolute top-[6.25%] right-[4.6875%] bottom-[6.25%] left-[4.6875%] z-10 border border-red-500/50"
            aria-hidden="true"
          />
        </div>
      </div>
    </main>
  )
}

export default App
