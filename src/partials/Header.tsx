import { ChevronDown, Square, SquareCheck } from 'lucide-react'
import { flights } from '../data/flights'
import type { Flight } from '../data/types'

const jumps = [
  { label: '0%', to: 0 },
  { label: '50%', to: 0.5 },
  { label: '90%', to: 0.9 },
  { label: '100%', to: 1 },
]

export function Header({
  flight,
  onSelectFlight,
  paused,
  onToggle,
  onSeek,
  showCountryNames,
  onToggleCountryNames,
}: {
  flight: Flight
  onSelectFlight: (id: string) => void
  paused: boolean
  onToggle: () => void
  onSeek: (to: number) => void
  showCountryNames: boolean
  onToggleCountryNames: () => void
}) {
  return (
    <header className="flex w-5xl items-center justify-between rounded-xl">
      {flights.length > 1 ? (
        <div className="relative">
          <select
            value={flight.id}
            onChange={(e) => onSelectFlight(e.target.value)}
            className="h-12 cursor-pointer appearance-none rounded-xl bg-gray-900 px-4 pr-12 text-xl font-medium text-white hover:bg-gray-700"
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
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="w-24 cursor-pointer rounded-xl bg-gray-900 px-4 py-3 font-medium text-white hover:bg-gray-700"
        >
          {paused ? 'Play' : 'Pause'}
        </button>
        <div className="flex h-12 items-center gap-2 rounded-xl border border-gray-400/60 p-1">
          {jumps.map(({ label, to }) => (
            <button
              key={label}
              type="button"
              onClick={() => onSeek(to)}
              className="cursor-pointer rounded-lg px-3 py-2 hover:bg-gray-300"
            >
              {label}
            </button>
          ))}
          <div className="h-6 w-px bg-gray-400"></div>
          <button
            type="button"
            aria-pressed={showCountryNames}
            onClick={onToggleCountryNames}
            className="flex cursor-pointer gap-1 rounded-lg px-3 py-2 hover:bg-gray-300"
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
