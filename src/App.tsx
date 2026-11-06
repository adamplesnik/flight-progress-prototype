import { useCallback, useMemo, useRef, useState } from 'react'
import { defaultFlight, flights } from './data/flights'
import { computeLayout } from './layout/computeLayout'
import { CountryNames } from './partials/CountryNames'
import { FlightProgress } from './partials/FlightProgress'
import { Header } from './partials/Header'
import { PlaybackControls } from './partials/PlaybackControls'
import { WorldMapView } from './partials/WorldMapView'

function App() {
  const [flightId, setFlightId] = useState(defaultFlight.id)
  const flight = flights.find((f) => f.id === flightId) ?? defaultFlight
  const [paused, setPaused] = useState(false)
  // Country names on the map (toggle in the header)
  const [showCountryNames, setShowCountryNames] = useState(false)
  const [seek, setSeek] = useState<{ to: number; id: number } | null>(null)
  const [scrubbing, setScrubbing] = useState(false)
  const sliderRef = useRef<HTMLInputElement>(null)
  // Every frame: straight to the slider, so following the animation re-renders nothing
  const onProgress = useCallback((progress: number) => {
    const slider = sliderRef.current
    if (!slider) return
    slider.value = String(progress * 100)
    slider.style.setProperty('--value', `${progress * 100}%`)
  }, [])
  const layout = useMemo(() => computeLayout(flight), [flight])

  const selectFlight = (id: string) => {
    setFlightId(id)
    setSeek(null)
  }

  return (
    <main className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 p-4 text-[#090909]">
      <div className="flex w-full max-w-5xl flex-col gap-4 lg:w-[min(100vw-32px,(100dvh-160px)*4/3)]">
        <Header
          flight={flight}
          onSelectFlight={selectFlight}
          showCountryNames={showCountryNames}
          onToggleCountryNames={() => setShowCountryNames((v) => !v)}
        />
        <div className="aspect-4/3 w-full shrink-0 overflow-hidden rounded-xl border border-gray-300">
          <div className="scene">
            <WorldMapView map={layout.map} />
            {showCountryNames && <CountryNames map={layout.map} />}
            <FlightProgress
              key={flight.id}
              flight={flight}
              layout={layout}
              paused={paused || scrubbing}
              seek={seek}
              onProgress={onProgress}
            />
          </div>
        </div>
        <PlaybackControls
          paused={paused}
          onToggle={() => setPaused((p) => !p)}
          onSeek={(to) => setSeek((prev) => ({ to, id: (prev?.id ?? 0) + 1 }))}
          onScrubChange={setScrubbing}
          sliderRef={sliderRef}
        />
      </div>
    </main>
  )
}

export default App
