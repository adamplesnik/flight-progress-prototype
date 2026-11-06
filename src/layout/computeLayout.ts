import type {
  CitySide,
  Corner,
  Flight,
  Orientation,
  PlacedCity,
  Point,
  SceneLayout,
} from '../data/types'
import { greatCircle, MAX_LAT, project, WORLD, type LatLon } from './projection'
import { textWidth } from './textMetrics'

type Rect = { x: number; y: number; w: number; h: number }

const MARGIN = 48 // safe zone: nothing but the map may leave it

// Sizes of the components, in scene px (see index.css)
const DOT_RADIUS = 24
const MARKER_RADIUS = 18 // the route's outer limit: the marker travels along it
const CITY_GAP = 40 // dot centre → city text

// Clearances
const CITY_LINE_CLEARANCE = 10
const OBSTACLE_PADDING = 8

// Search
const ROUTE_STEPS = 96
const SCALE_STEP = 0.98
const MAX_SCALE = 12 // Melbourne-Hobart needs about 8
const MIN_SCALE = 0.12 // the map repeats sideways, so routes half the world long fit too
const REFINE_STEPS = 7

const CITY_POSITIONS: { placement: CitySide; align: 'start' | 'end' }[] = [
  { placement: 'above', align: 'end' },
  { placement: 'above', align: 'start' },
  { placement: 'below', align: 'end' },
  { placement: 'below', align: 'start' },
  { placement: 'right', align: 'start' },
  { placement: 'left', align: 'end' },
]

// A bottom row or a right column holds progress and flight data, and the route and cities
// get the rest of the safe zone, less a 16px gap
const LAYOUTS: {
  area: Rect
  flightData: { corner: Corner; orientation: Orientation }
  progress: { corner: Corner; rows: 1 | 2 }
}[] = [
  {
    area: { x: MARGIN, y: MARGIN, w: 928, h: 560 },
    flightData: { corner: 'bottom-right', orientation: 'row' },
    progress: { corner: 'bottom-left', rows: 1 },
  },
  {
    area: { x: MARGIN, y: MARGIN, w: 692, h: 672 },
    flightData: { corner: 'bottom-right', orientation: 'column' },
    progress: { corner: 'top-right', rows: 2 },
  },
]

const overlaps = (a: Rect, b: Rect, padding = 0) =>
  a.x < b.x + b.w + padding &&
  a.x + a.w + padding > b.x &&
  a.y < b.y + b.h + padding &&
  a.y + a.h + padding > b.y

const distanceSquared = (r: Rect, p: Point) => {
  const dx = Math.max(r.x - p.x, 0, p.x - r.x - r.w)
  const dy = Math.max(r.y - p.y, 0, p.y - r.y - r.h)
  return dx * dx + dy * dy
}

const clearOfLine = (r: Rect, line: Point[], clearance: number) =>
  line.every((p) => distanceSquared(r, p) >= clearance * clearance)

const dotRect = ({ x, y }: Point): Rect => ({
  x: x - DOT_RADIUS,
  y: y - DOT_RADIUS,
  w: 2 * DOT_RADIUS,
  h: 2 * DOT_RADIUS,
})

/** City text area relative to the dot's centre. */
function cityOffset(
  { placement, align }: (typeof CITY_POSITIONS)[number],
  size: { w: number; h: number }
): Rect {
  const { w, h } = size
  if (placement === 'right') return { x: CITY_GAP, y: -DOT_RADIUS, w, h }
  if (placement === 'left') return { x: -CITY_GAP - w, y: -DOT_RADIUS, w, h }
  return {
    x: align === 'end' ? DOT_RADIUS - w : -DOT_RADIUS,
    y: placement === 'above' ? -CITY_GAP - h : CITY_GAP,
    w,
    h,
  }
}

/**
 * Step 0: the route on the map. The map repeats sideways, so a route crossing the date line
 * simply carries on into the next copy.
 */
function routeOnMap(flight: Flight) {
  const stops: LatLon[] = [
    flight.origin,
    ...(flight.waypoints ?? []),
    flight.destination,
  ]
  const legSteps = Math.ceil(ROUTE_STEPS / (stops.length - 1))
  const geo = stops
    .slice(1)
    .flatMap((stop, i) =>
      greatCircle(stops[i], stop, legSteps).slice(i === 0 ? 0 : 1)
    )
  const points: Point[] = []
  for (const position of geo) {
    const { x, y } = project(position)
    const previous = points[points.length - 1]
    const copies = previous ? Math.round((previous.x - x) / WORLD.size) : 0
    points.push({ x: x + copies * WORLD.size, y })
  }
  return { points, leavesMap: geo.some((p) => Math.abs(p.lat) > MAX_LAT) }
}

export function computeLayout(flight: Flight): SceneLayout {
  const { points: mapPoints, leavesMap } = routeOnMap(flight)
  const start = mapPoints[0]
  const end = mapPoints[mapPoints.length - 1]

  const citySize = ({ city, label }: Flight['origin']) => ({
    w: Math.max(textWidth(city, 52, 600), textWidth(label, 36, 600)),
    h: 96,
  })
  const originSize = citySize(flight.origin)
  const destinationSize = citySize(flight.destination)

  /** The largest scale at which route and cities fit this area, and the room left. */
  const fit = (originOffset: Rect, destinationOffset: Rect, area: Rect) => {
    const extent = (s: number, axis: 'x' | 'y') => {
      const size = axis === 'x' ? 'w' : 'h'
      let lo = Infinity
      let hi = -Infinity
      for (const p of mapPoints) {
        lo = Math.min(lo, s * p[axis] - MARKER_RADIUS)
        hi = Math.max(hi, s * p[axis] + MARKER_RADIUS)
      }
      for (const [dot, offset] of [
        [start, originOffset],
        [end, destinationOffset],
      ] as const) {
        const at = s * dot[axis]
        lo = Math.min(lo, at - DOT_RADIUS, at + offset[axis])
        hi = Math.max(hi, at + DOT_RADIUS, at + offset[axis] + offset[size])
      }
      return { lo, hi }
    }
    const room = (s: number) => {
      const x = extent(s, 'x')
      const y = extent(s, 'y')
      return {
        x: [area.x - x.lo, area.x + area.w - x.hi] as const,
        y: [area.y - y.lo, area.y + area.h - y.hi] as const,
      }
    }
    const fits = (s: number) => {
      const r = room(s)
      return r.x[0] <= r.x[1] && r.y[0] <= r.y[1]
    }
    let low = 0
    let high = MAX_SCALE
    if (fits(high)) low = high
    else
      for (let i = 0; i < 24; i++) {
        const mid = (low + high) / 2
        if (fits(mid)) low = mid
        else high = mid
      }
    return { maxScale: low, room }
  }

  const combos = CITY_POSITIONS.flatMap((originPosition) =>
    CITY_POSITIONS.map((destinationPosition) => ({
      originPosition,
      destinationPosition,
      originOffset: cityOffset(originPosition, originSize),
      destinationOffset: cityOffset(destinationPosition, destinationSize),
    }))
  )
  type Combo = (typeof combos)[number]

  const toScene = (s: number, tx: number, ty: number) =>
    mapPoints.map((p) => ({ x: s * p.x + tx, y: s * p.y + ty }))

  /** Whether both city clusters and dots stay clear of each other and of the line. */
  const citiesClear = (line: Point[], combo: Combo) => {
    const dotA = line[0]
    const dotB = line[line.length - 1]
    const cityA = {
      ...combo.originOffset,
      x: dotA.x + combo.originOffset.x,
      y: dotA.y + combo.originOffset.y,
    }
    const cityB = {
      ...combo.destinationOffset,
      x: dotB.x + combo.destinationOffset.x,
      y: dotB.y + combo.destinationOffset.y,
    }
    return (
      clearOfLine(cityA, line, CITY_LINE_CLEARANCE) &&
      clearOfLine(cityB, line, CITY_LINE_CLEARANCE) &&
      !overlaps(cityA, cityB, OBSTACLE_PADDING) &&
      !overlaps(cityA, dotRect(dotB), OBSTACLE_PADDING) &&
      !overlaps(cityB, dotRect(dotA), OBSTACLE_PADDING)
    )
  }

  type Placement = {
    s: number
    tx: number
    ty: number
    combo: Combo
    layout: (typeof LAYOUTS)[number]
  }

  /**
   * For both layouts, the route and cities centred in their area at the largest scale where
   * they do not collide. The larger result wins; on a tie, the row.
   */
  const solve = (): Placement | null => {
    let best: Placement | null = null
    for (const layout of LAYOUTS)
      for (const combo of combos) {
        const { maxScale, room } = fit(
          combo.originOffset,
          combo.destinationOffset,
          layout.area
        )
        const at = (s: number): Placement | null => {
          const r = room(s)
          const tx = (r.x[0] + r.x[1]) / 2
          const ty = (r.y[0] + r.y[1]) / 2
          return citiesClear(toScene(s, tx, ty), combo)
            ? { s, tx, ty, combo, layout }
            : null
        }
        let found: Placement | null = null
        let tooLarge = maxScale
        for (
          let s = maxScale;
          s >= MIN_SCALE && s > (best?.s ?? 0) && !found;
          s *= SCALE_STEP
        ) {
          found = at(s)
          if (!found) tooLarge = s
        }
        if (!found) continue
        let low = found.s
        let high = tooLarge
        for (let i = 0; i < REFINE_STEPS && high > low; i++) {
          const mid = (low + high) / 2
          const better = at(mid)
          if (better) {
            found = better
            low = mid
          } else high = mid
        }
        if (!best || found.s > best.s) best = found
      }
    return best
  }

  /** Nothing fits every rule: the largest sensible layout, centred. */
  const fallback = (): Placement => {
    const layout = LAYOUTS[0]
    const fitted = combos.map((combo) => ({
      combo,
      ...fit(combo.originOffset, combo.destinationOffset, layout.area),
    }))
    const { combo, maxScale, room } = fitted.reduce((a, b) =>
      b.maxScale > a.maxScale ? b : a
    )
    const s = Math.max(maxScale * 0.7, MIN_SCALE)
    const r = room(s)
    return {
      s,
      tx: (r.x[0] + r.x[1]) / 2,
      ty: (r.y[0] + r.y[1]) / 2,
      combo,
      layout,
    }
  }

  const warnings: string[] = []
  if (leavesMap)
    warnings.push(
      `The route passes beyond ${MAX_LAT.toFixed(0)}° latitude, where the map ends: it is flattened along the map's edge.`
    )
  const solved = solve()
  if (!solved)
    warnings.push('No layout satisfies all rules: some components may collide.')
  const { s, tx, ty, combo, layout } = solved ?? fallback()
  const line = toScene(s, tx, ty)

  const place = (
    city: Flight['origin'],
    dot: Point,
    position: (typeof CITY_POSITIONS)[number]
  ): PlacedCity => ({
    city: city.city,
    label: city.label,
    dot,
    placement: position.placement,
    align: position.align,
  })

  return {
    map: { x: -tx / s, y: -ty / s, scale: s },
    route: `M${line.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L')}`,
    origin: place(flight.origin, line[0], combo.originPosition),
    destination: place(
      flight.destination,
      line[line.length - 1],
      combo.destinationPosition
    ),
    progress: layout.progress,
    flightData: layout.flightData,
    report: { scale: s, warnings },
  }
}
