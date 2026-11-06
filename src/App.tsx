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
    <main className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 p-4 text-[#090909]">
      <Header
        flight={flight}
        onSelectFlight={selectFlight}
        paused={paused}
        onToggle={() => setPaused((p) => !p)}
        showCountryNames={showCountryNames}
        onToggleCountryNames={() => setShowCountryNames((v) => !v)}
        onSeek={(to) => setSeek((prev) => ({ to, id: (prev?.id ?? 0) + 1 }))}
      />
      <div className="aspect-4/3 w-full max-w-5xl shrink-0 overflow-hidden rounded-xl border border-gray-300 lg:w-[min(100vw-32px,(100dvh-96px)*4/3)]">
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
