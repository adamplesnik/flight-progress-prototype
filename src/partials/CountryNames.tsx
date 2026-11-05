import { countryLabels } from '../data/countryLabels'
import type { SceneLayout } from '../data/types'
import { WORLD_MAPS } from '../layout/projection'
import { boxStyle, SCENE } from './scene'

/** Country names, drawn over the world map (names stay 14px at the design size). */
export function CountryNames({
  map: { src, box },
}: {
  map: SceneLayout['map']
}) {
  const world = WORLD_MAPS.find((m) => m.src === src) ?? WORLD_MAPS[0]
  const scale = ((box.width / 100) * SCENE.w) / world.width
  return (
    <svg
      className="world-map country-names"
      style={boxStyle(box)}
      viewBox={`0 0 ${world.width} ${world.height}`}
      aria-hidden="true"
    >
      {countryLabels.map(({ id, name, x, y }) => {
        const at = world.fromSource({ x, y })
        return (
          <text key={id} x={at.x} y={at.y} fontSize={14 / scale}>
            {name}
          </text>
        )
      })}
    </svg>
  )
}
