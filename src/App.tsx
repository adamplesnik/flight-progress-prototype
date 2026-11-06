import { useMemo, useState } from 'react'
import { defaultFlight, flights } from './data/flights'
import { computeLayout } from './layout/computeLayout'
import { Controls } from './partials/Controls'
import { CountryNames } from './partials/CountryNames'
import { FlightProgress } from './partials/FlightProgress'
import { WorldMapView } from './partials/WorldMapView'

function App() {
  const [flightId, setFlightId] = useState(defaultFlight.id)
  const flight = flights.find((f) => f.id === flightId) ?? defaultFlight
  const [paused, setPaused] = useState(false)
  // Country names on the map (toggle in the controls)
  const [showCountryNames, setShowCountryNames] = useState(false)
  const [seek, setSeek] = useState<{ to: number; id: number } | null>(null)
  const layout = useMemo(() => computeLayout(flight), [flight])

  const selectFlight = (id: string) => {
    setFlightId(id)
    setSeek(null)
  }

  return (
    <main className="wrapper">
      <div className="flex w-5xl items-center justify-between rounded-xl">
        {flights.length > 1 ? (
          <select
            value={flight.id}
            onChange={(e) => selectFlight(e.target.value)}
            className="rounded-xl text-2xl font-semibold"
          >
            {flights.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
              </option>
            ))}
          </select>
        ) : (
          <h1 className="text-2xl font-semibold">{flight.title}</h1>
        )}
        <Controls
          paused={paused}
          onToggle={() => setPaused((p) => !p)}
          showCountryNames={showCountryNames}
          onToggleCountryNames={() => setShowCountryNames((v) => !v)}
          onSeek={(to) => setSeek((prev) => ({ to, id: (prev?.id ?? 0) + 1 }))}
        />
      </div>
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
        </div>
      </div>
    </main>
  )
}

export default App
