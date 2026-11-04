import type { Endpoint } from '../data/types'

export function CityCluster({
  city,
  label,
  dot,
  align = 'start',
  placement,
}: Endpoint & { placement: 'above' | 'below' }) {
  return (
    <section
      className={`city-cluster ${placement} align-${align}`}
      style={{ left: `${dot.left}%`, top: `${dot.top}%` }}
    >
      <span className="route-dot" aria-hidden="true" />
      <div className="city-copy">
        <h1>{city}</h1>
        <p>{label}</p>
      </div>
    </section>
  )
}
