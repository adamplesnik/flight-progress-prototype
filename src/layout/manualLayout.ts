import type { Flight, PlacedCity, SceneLayout } from '../data/types'

/** The hand-tuned layout of a flight, as a scene layout. */
export function manualLayout(flight: Flight): SceneLayout | null {
  const manual = flight.manual
  if (!manual) return null
  const below = manual.cities === 'below'
  const place = (
    city: Flight['origin'],
    { dot, align = 'start' }: NonNullable<Flight['manual']>['origin']
  ): PlacedCity => ({
    city: city.city,
    label: city.label,
    dot,
    align,
    placement: manual.cities,
  })
  return {
    map: manual.map,
    route: manual.route,
    origin: place(flight.origin, manual.origin),
    destination: place(flight.destination, manual.destination),
    label: { kind: below ? 'avoid' : 'fixed' },
    flightData: {
      corner: below ? 'bottom-right' : 'top-right',
      orientation: 'row',
    },
    clock: { corner: below ? 'top-left' : 'bottom-left' },
  }
}
