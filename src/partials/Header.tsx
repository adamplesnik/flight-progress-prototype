import { IconChevronDown } from './icons'
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
  if (!onSelectFlight || flights.length < 2)
    return <h1 className="title">{flightTitle(flight)}</h1>
  return (
    <div className="flight-picker">
      <select
        value={flight.id}
        onChange={(e) => onSelectFlight(flights[e.target.selectedIndex])}
      >
        {flights.map((f) => (
          <option key={f.id} value={f.id}>
            {flightTitle(f)}
          </option>
        ))}
      </select>
      <IconChevronDown />
    </div>
  )
}
