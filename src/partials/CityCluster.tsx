import { IconArrowRight } from './icons'
import type { PlacedCity } from '../data/types'
import { SCENE } from './scene'

export function CityCluster({
  city,
  time,
  isDestination,
  dot,
  align,
  placement,
}: PlacedCity) {
  return (
    <section
      className={`city-cluster ${placement} align-${align} ${isDestination ? 'destination' : ''}`}
      style={{
        left: `${(dot.x / SCENE.w) * 100}%`,
        top: `${(dot.y / SCENE.h) * 100}%`,
      }}
    >
      <span className="route-dot" aria-hidden="true" />
      <div className="city-copy">
        <h1>{city}</h1>
        <p>
          {time}
          <IconArrowRight size="3.3cqw" strokeWidth="3" />
        </p>
      </div>
    </section>
  )
}
