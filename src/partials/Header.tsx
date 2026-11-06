import clsx from 'clsx'
import { ChevronDown, Square, SquareCheck } from 'lucide-react'
import type { RefObject } from 'react'
import { flights } from '../data/flights'
import type { Flight } from '../data/types'

export function Header({
  flight,
  onSelectFlight,
  paused,
  onToggle,
  onSeek,
  onScrubChange,
  sliderRef,
  showCountryNames,
  onToggleCountryNames,
}: {
  flight: Flight
  onSelectFlight: (id: string) => void
  paused: boolean
  onToggle: () => void
  onSeek: (to: number) => void
  /** The slider is being dragged: the flight holds still meanwhile. */
  onScrubChange: (scrubbing: boolean) => void
  /** The slider follows the animation through this ref, without re-rendering. */
  sliderRef: RefObject<HTMLInputElement | null>
  showCountryNames: boolean
  onToggleCountryNames: () => void
}) {
  const startScrub = () => {
    onScrubChange(true)
    const end = () => {
      onScrubChange(false)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
  }

  return (
    <header className="flex w-full max-w-5xl flex-col gap-2 rounded-xl md:flex-row md:justify-between lg:items-center">
      {flights.length > 1 ? (
        <div className="relative">
          <select
            value={flight.id}
            onChange={(e) => onSelectFlight(e.target.value)}
            className="h-12 w-full cursor-pointer appearance-none rounded-xl bg-gray-900 px-4 pr-12 text-xl font-medium text-white hover:bg-gray-700 lg:w-auto"
          >
            {flights.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-3 right-3 text-white" />
        </div>
      ) : (
        <h1 className="text-2xl font-semibold">{flight.title}</h1>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onToggle}
          className="w-full cursor-pointer rounded-xl bg-gray-900 px-4 py-3 font-medium text-white hover:bg-gray-700 sm:w-24"
        >
          {paused ? 'Play' : 'Pause'}
        </button>
        <div className="flex flex-col gap-2 rounded-xl border border-gray-400/60 p-1 sm:h-12 sm:flex-1 sm:flex-row sm:items-center lg:flex-none">
          <input
            ref={sliderRef}
            type="range"
            min={0}
            max={100}
            step={0.1}
            defaultValue={0}
            aria-label="Flight progress"
            onChange={(e) => onSeek(e.target.valueAsNumber / 100)}
            onPointerDown={startScrub}
            className={clsx(
              'h-12 w-full cursor-pointer touch-pan-y appearance-none bg-transparent px-2',
              'sm:h-10 sm:flex-1 lg:w-60 lg:flex-none',
              // The track's filled part: --value is set by the animation
              '[--fill:linear-gradient(90deg,var(--color-gray-900)_var(--value),transparent_0)]',
              '[&::-webkit-slider-runnable-track]:h-2',
              '[&::-webkit-slider-runnable-track]:rounded-full',
              '[&::-webkit-slider-runnable-track]:bg-gray-400/60',
              '[&::-webkit-slider-runnable-track]:bg-(image:--fill)',
              '[&::-webkit-slider-thumb]:-mt-2.5',
              '[&::-webkit-slider-thumb]:size-7',
              '[&::-webkit-slider-thumb]:appearance-none',
              '[&::-webkit-slider-thumb]:rounded-full',
              '[&::-webkit-slider-thumb]:bg-gray-900',
              '[&::-moz-range-track]:h-2',
              '[&::-moz-range-track]:rounded-full',
              '[&::-moz-range-track]:bg-gray-400/60',
              '[&::-moz-range-progress]:h-2',
              '[&::-moz-range-progress]:rounded-full',
              '[&::-moz-range-progress]:bg-gray-900',
              '[&::-moz-range-thumb]:size-7',
              '[&::-moz-range-thumb]:rounded-full',
              '[&::-moz-range-thumb]:border-0',
              '[&::-moz-range-thumb]:bg-gray-900'
            )}
          />
          <div className="h-px w-full bg-gray-400 sm:h-6 sm:w-px"></div>
          <button
            type="button"
            aria-pressed={showCountryNames}
            onClick={onToggleCountryNames}
            className="flex cursor-pointer justify-center gap-1 rounded-lg px-3 py-2 hover:bg-gray-300"
          >
            {showCountryNames ? (
              <SquareCheck className="w-4" />
            ) : (
              <Square className="w-4" />
            )}
            Country names
          </button>
        </div>
      </div>
    </header>
  )
}
