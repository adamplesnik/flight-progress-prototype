import { countryLabels } from '../data/countryLabels'

export function CountryNames() {
  return (
    <svg
      className="world-map country-names"
      viewBox="0 0 4003.05 1721.37"
      aria-hidden="true"
    >
      {countryLabels.map(({ id, name, x, y }) => (
        <text key={id} x={x} y={y}>
          {name}
        </text>
      ))}
    </svg>
  )
}
