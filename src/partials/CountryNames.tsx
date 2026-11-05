import { countryLabels } from '../data/countryLabels'
import type { Box } from '../data/types'
import { boxStyle, SCENE } from './scene'

const MAP_WIDTH = 4003.05
const MAP_HEIGHT = 1721.37

/** Country names, drawn over the world map at `box` (names stay 14px at the design size). */
export function CountryNames({ box }: { box: Box }) {
  const scale = ((box.width / 100) * SCENE.w) / MAP_WIDTH
  return (
    <svg
      className="world-map country-names"
      style={boxStyle(box)}
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      aria-hidden="true"
    >
      {countryLabels.map(({ id, name, x, y }) => (
        <text key={id} x={x} y={y} fontSize={14 / scale}>
          {name}
        </text>
      ))}
    </svg>
  )
}
