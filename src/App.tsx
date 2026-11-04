import { useCallback, useMemo, useState } from 'react'
import { createFlightModel, type FlightReadout } from './data/flightModel'
import { defaultFlight, flights } from './data/flights'
import { AnimatedRoute } from './partials/AnimatedRoute'
import { CityCluster } from './partials/CityCluster'
import { Controls } from './partials/Controls'
import { CountryNames } from './partials/CountryNames'
import { FlightData } from './partials/FlightData'
import { LocalTime } from './partials/LocalTime'

const initialFlightProgress = 0.2

function App() {
  const [flightId, setFlightId] = useState(defaultFlight.id)
  const flight = flights.find((f) => f.id === flightId) ?? defaultFlight
  const model = useMemo(() => createFlightModel(flight), [flight])

  const [data, setData] = useState(() => model.readoutAt(initialFlightProgress))
  const [paused, setPaused] = useState(false)
  // Country names on the map (toggle in the controls)
  const [showCountryNames, setShowCountryNames] = useState(false)
  const [seek, setSeek] = useState<{ to: number; id: number } | null>(null)
  const onReadout = useCallback((next: FlightReadout) => {
    setData((prev) =>
      (Object.keys(next) as (keyof FlightReadout)[]).every(
        (k) => prev[k] === next[k]
      )
        ? prev
        : next
    )
  }, [])

  const selectFlight = (id: string) => {
    const next = flights.find((f) => f.id === id)
    if (!next) return
    setFlightId(id)
    setData(createFlightModel(next).readoutAt(initialFlightProgress))
    setSeek(null)
  }

  const { box: mapBox, src: mapSrc } = flight.map

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
          <img
            className="world-map"
            src={mapSrc}
            style={{
              left: `${mapBox.left}%`,
              top: `${mapBox.top}%`,
              width: `${mapBox.width}%`,
              height: `${mapBox.height}%`,
            }}
            alt=""
            aria-hidden="true"
          />
          {showCountryNames && <CountryNames />}
          <AnimatedRoute
            key={flight.id}
            flight={flight}
            model={model}
            data={data}
            onReadout={onReadout}
            initialProgress={initialFlightProgress}
            paused={paused}
            seek={seek}
          />
          <CityCluster {...flight.destination} />
          <CityCluster {...flight.origin} />
          <FlightData data={data} />
          <LocalTime clock={data.clock} />
        </div>
      </div>
    </main>
  )
}

export default App
