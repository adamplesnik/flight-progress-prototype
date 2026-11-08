import { ChevronDown, Square, SquareCheck } from 'lucide-react'
import { flights } from '../data/flights'
import type { Flight } from '../data/types'

// Hidden for now: set to true to bring the switch back
const SHOW_COUNTRY_NAMES_SWITCH = false

export function Header({
  flight,
  onSelectFlight,
  showCountryNames,
  onToggleCountryNames,
}: {
  flight: Flight
  onSelectFlight: (id: string) => void
  showCountryNames: boolean
  onToggleCountryNames: () => void
}) {
  return (
    <header className="flex w-full flex-col gap-2 rounded-xl md:flex-row md:justify-between lg:items-center">
      {flights.length > 1 ? (
        <div className="relative">
          <select
            value={flight.id}
            onChange={(e) => onSelectFlight(e.target.value)}
            className="h-12 w-full cursor-pointer appearance-none rounded-xl bg-main px-4 pr-12 text-xl font-medium text-background hover:bg-subtle lg:w-auto"
          >
            {flights.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-3 right-3 text-background" />
        </div>
      ) : (
        <h1 className="text-2xl font-semibold">{flight.title}</h1>
      )}
      {SHOW_COUNTRY_NAMES_SWITCH && (
        <button
          type="button"
          aria-pressed={showCountryNames}
          onClick={onToggleCountryNames}
          className="flex cursor-pointer justify-center gap-1 rounded-lg px-3 py-2 hover:bg-border/50"
        >
          {showCountryNames ? (
            <SquareCheck className="w-4" />
          ) : (
            <Square className="w-4" />
          )}
          Country names
        </button>
      )}
    </header>
  )
}
