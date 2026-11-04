import type { Endpoint } from '../data/types'

export function CityCluster({ city, label, position }: Endpoint) {
  return (
    <section
      className="city-cluster"
      style={{ left: `${position.left}%`, top: `${position.top}%` }}
    >
      <div className="city-copy">
        <h1>{city}</h1>
        <p>{label}</p>
      </div>
      <span className="route-dot" aria-hidden="true" />
    </section>
  )
}
