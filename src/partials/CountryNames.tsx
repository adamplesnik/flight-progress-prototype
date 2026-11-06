import { countryLabels } from '../data/countryLabels'
import type { SceneLayout } from '../data/types'
import { WORLD } from '../layout/projection'
import { mapView } from './scene'

/** Country names, drawn over the world map (names stay 14px at the design size). */
export function CountryNames({ map }: { map: SceneLayout['map'] }) {
  const { viewBox, copies } = mapView(map)
  return (
    <svg className="world-map country-names" viewBox={viewBox} aria-hidden="true">
      {copies.flatMap((copy) =>
        countryLabels.map(({ name, x, y }) => (
          <text
            key={`${copy}-${name}`}
            x={x + copy * WORLD.size}
            y={y}
            fontSize={14 / map.scale}
          >
            {name}
          </text>
        ))
      )}
    </svg>
  )
}
