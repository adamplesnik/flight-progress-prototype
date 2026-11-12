import {
  IconChevronDown,
  IconSquare,
  IconSquareCheckFilled,
} from '@tabler/icons-react'
import { flightPath, flights, flightTitle } from '../data/flights'
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
  onSelectFlight: (flight: Flight) => void
  showCountryNames: boolean
  onToggleCountryNames: () => void
}) {
  return (
    <header className="flex w-full flex-col gap-2 rounded-md md:flex-row md:justify-between lg:items-center">
      {flights.length > 1 ? (
        <div className="relative">
          <select
            value={flightPath(flight)}
            onChange={(e) => onSelectFlight(flights[e.target.selectedIndex])}
            className="h-12 w-full cursor-pointer appearance-none rounded-md px-4 pr-12 text-2xl font-semibold hover:bg-container lg:w-auto"
          >
            {flights.map((f) => (
              <option key={f.id} value={flightPath(f)}>
                {flightTitle(f)}
              </option>
            ))}
          </select>
          <IconChevronDown className="pointer-events-none absolute top-3 right-3 text-main" />
        </div>
      ) : (
        <h1 className="text-2xl font-semibold">{flightTitle(flight)}</h1>
      )}
      {SHOW_COUNTRY_NAMES_SWITCH && (
        <button
          type="button"
          aria-pressed={showCountryNames}
          onClick={onToggleCountryNames}
          className="flex cursor-pointer justify-center gap-1 rounded-lg px-3 py-2 hover:bg-outline/50"
        >
          {showCountryNames ? (
            <IconSquareCheckFilled className="w-8" />
          ) : (
            <IconSquare className="w-8" />
          )}
          Country names
        </button>
      )}
    </header>
  )
}
