import { Analytics } from '@vercel/analytics/react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { flightPath, flightTitle } from './data/flights'
import type { Flight } from './data/types'
import { computeLayout } from './layout/computeLayout'
import { CountryNames } from './partials/CountryNames'
import { FlightProgress } from './partials/FlightProgress'
import { Header } from './partials/Header'
import { PlaybackControls } from './partials/PlaybackControls'
import { WorldMapView } from './partials/WorldMapView'

function App({ flight }: { flight: Flight }) {
  const navigate = useNavigate()
  const [paused, setPaused] = useState(false)
  // Country names on the map (toggle in the header)
  const [showCountryNames, setShowCountryNames] = useState(false)
  // A seek belongs to the flight it was made on, so a new flight starts from the beginning
  const [seekState, setSeek] = useState<{
    to: number
    id: number
    flight: string
  } | null>(null)
  const seek = seekState?.flight === flight.id ? seekState : null
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

  return (
    <main className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 p-4 text-main">
      <title>{`${flightTitle(flight)} · Flight progress prototype`}</title>
      <div className="flex w-full max-w-5xl flex-col gap-4 lg:w-[min(100vw-32px,(100dvh-160px)*4/3)]">
        <Header
          flight={flight}
          onSelectFlight={(f) => navigate(flightPath(f))}
          showCountryNames={showCountryNames}
          onToggleCountryNames={() => setShowCountryNames((v) => !v)}
        />
        <div className="aspect-4/3 w-full shrink-0 overflow-hidden rounded-md border border-outline">
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
          onSeek={(to) =>
            setSeek((prev) => ({
              to,
              id: (prev?.id ?? 0) + 1,
              flight: flight.id,
            }))
          }
          onScrubChange={setScrubbing}
          sliderRef={sliderRef}
        />
      </div>
      <Analytics />
    </main>
  )
}

export default App
