import {
  IconChevronDown,
  IconSquare,
  IconSquareCheckFilled,
} from '@tabler/icons-react'
import { flightTitle } from '../data/flights'
import type { Flight } from '../data/types'

// Hidden for now: set to true to bring the switch back
const SHOW_COUNTRY_NAMES_SWITCH = false

export function Header({
  flight,
  flights,
  onSelectFlight,
  showCountryNames,
  onToggleCountryNames,
}: {
  flight: Flight
  /** Two or more, with `onSelectFlight`, turn the title into a picker */
  flights: Flight[]
  onSelectFlight?: (flight: Flight) => void
  showCountryNames: boolean
  onToggleCountryNames: () => void
}) {
  return (
    <header className="fp:flex fp:w-full fp:flex-col fp:gap-2 fp:rounded-md fp:md:flex-row fp:md:justify-between fp:lg:items-center">
      {onSelectFlight && flights.length > 1 ? (
        <div className="fp:relative">
          <select
            value={flight.id}
            onChange={(e) => onSelectFlight(flights[e.target.selectedIndex])}
            className="fp:h-12 fp:w-full fp:cursor-pointer fp:appearance-none fp:rounded-md fp:px-4 fp:pr-12 fp:text-2xl fp:font-semibold fp:hover:bg-container fp:lg:w-auto"
          >
            {flights.map((f) => (
              <option key={f.id} value={f.id}>
                {flightTitle(f)}
              </option>
            ))}
          </select>
          <IconChevronDown className="fp:pointer-events-none fp:absolute fp:top-3 fp:right-3 fp:text-main" />
        </div>
      ) : (
        <h1 className="fp:text-2xl fp:font-semibold">{flightTitle(flight)}</h1>
      )}
      {SHOW_COUNTRY_NAMES_SWITCH && (
        <button
          type="button"
          aria-pressed={showCountryNames}
          onClick={onToggleCountryNames}
          className="fp:flex fp:cursor-pointer fp:justify-center fp:gap-1 fp:rounded-lg fp:px-3 fp:py-2 fp:hover:bg-outline/50"
        >
          {showCountryNames ? (
            <IconSquareCheckFilled className="fp:w-8" />
          ) : (
            <IconSquare className="fp:w-8" />
          )}
          Country names
        </button>
      )}
    </header>
  )
}
