import { IconChevronDown } from '@tabler/icons-react'
import { flightTitle } from '../data/flights'
import type { Flight } from '../data/types'

/** The flight's name, or a picker of flights */
export function Header({
  flight,
  flights,
  onSelectFlight,
}: {
  flight: Flight
  /** Two or more, with `onSelectFlight`, turn the title into a picker */
  flights: Flight[]
  onSelectFlight?: (flight: Flight) => void
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
    </header>
  )
}
