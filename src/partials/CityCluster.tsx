import type { PlacedCity } from '../data/types'
import { SCENE } from './scene'

export function CityCluster({
  city,
  label,
  dot,
  align = 'start',
  placement,
}: PlacedCity) {
  return (
    <section
      className={`city-cluster ${placement} align-${align}`}
      style={{
        left: `${(dot.x / SCENE.w) * 100}%`,
        top: `${(dot.y / SCENE.h) * 100}%`,
      }}
    >
      <span className="route-dot" aria-hidden="true" />
      <div className="city-copy">
        <h1>{city}</h1>
        <p>{label}</p>
      </div>
    </section>
  )
}
