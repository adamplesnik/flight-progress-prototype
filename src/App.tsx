import { useCallback, useState } from 'react'
import { readoutAt, type FlightReadout } from './flightData'
import { AnimatedRoute } from './partials/AnimatedRoute'
import { CityCluster } from './partials/CityCluster'
import { Controls } from './partials/Controls'
import { CountryNames } from './partials/CountryNames'
import { FlightData } from './partials/FlightData'
import { LocalTime } from './partials/LocalTime'

const assetPath = '/assets'
const initialFlightProgress = 0.9

function App() {
  const [data, setData] = useState(() => readoutAt(initialFlightProgress))
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

  return (
    <main className="wrapper">
      <div className="flex w-5xl items-center justify-between rounded-xl">
        <h1 className="text-2xl font-semibold">Dubai - London</h1>
        <Controls
          paused={paused}
          onToggle={() => setPaused((p) => !p)}
          showCountryNames={showCountryNames}
          onToggleCountryNames={() => setShowCountryNames((v) => !v)}
          onSeek={(to) => setSeek((prev) => ({ to, id: (prev?.id ?? 0) + 1 }))}
        />
      </div>
      <div className="flight-map">
        <div className="scene">
          <img
            className="world-map"
            src={`${assetPath}/150bf.svg`}
            alt=""
            aria-hidden="true"
          />

          {showCountryNames && <CountryNames />}

          <AnimatedRoute
            data={data}
            onReadout={onReadout}
            initialProgress={initialFlightProgress}
            paused={paused}
            seek={seek}
          />

          <CityCluster
            city="London"
            time="→ 06:50 GMT"
            className="london-cluster"
          />

          <CityCluster
            city="Dubai"
            time="03:40 GST →"
            className="dubai-cluster"
          />

          <FlightData data={data} />

          <LocalTime clock={data.clock} />
        </div>
      </div>
    </main>
  )
}

export default App
