type CityClusterProps = {
  city: string
  time: string
  className: string
}

export function CityCluster({ city, time, className }: CityClusterProps) {
  return (
    <section className={`city-cluster ${className}`}>
      <div className="city-copy">
        <h1>{city}</h1>
        <p>{time}</p>
      </div>
      <span className="route-dot" aria-hidden="true" />
    </section>
  )
}
