import { countryLabels } from '../data/countryLabels'
import type { Box } from '../data/types'

const MAP_WIDTH = 4003.05
const MAP_HEIGHT = 1721.37
const SCENE_WIDTH = 1024

/** Country names, drawn over the world map at `box` (names stay 16px on screen). */
export function CountryNames({ box }: { box: Box }) {
  const scale = ((box.width / 100) * SCENE_WIDTH) / MAP_WIDTH
  return (
    <svg
      className="world-map country-names"
      style={{
        left: `${box.left}%`,
        top: `${box.top}%`,
        width: `${box.width}%`,
        height: `${box.height}%`,
      }}
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      aria-hidden="true"
    >
      {countryLabels.map(({ id, name, x, y }) => (
        <text key={id} x={x} y={y} fontSize={16 / scale}>
          {name}
        </text>
      ))}
    </svg>
  )
}
