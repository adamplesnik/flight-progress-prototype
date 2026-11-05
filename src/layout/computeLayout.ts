import { createFlightModel } from '../data/flightModel'
import type {
  CitySide,
  Corner,
  Flight,
  LabelAnchor,
  LabelStep,
  Orientation,
  PlacedCity,
  Point,
  SceneLayout,
} from '../data/types'
import { SCENE } from '../partials/scene'
import {
  greatCircle,
  projectToSource,
  WORLD_MAPS,
  type LatLon,
  type WorldMap,
} from './projection'
import { textWidth } from './textMetrics'

type Rect = { x: number; y: number; w: number; h: number }

// Safe zone: nothing but the map may leave it
const MARGIN = 48
const SAFE: Rect = {
  x: MARGIN,
  y: MARGIN,
  w: SCENE.w - 2 * MARGIN,
  h: SCENE.h - 2 * MARGIN,
}

// Sizes of the components, in scene px (see index.css)
const DOT_RADIUS = 24
const LINE_RADIUS = 8
const CITY_GAP = 40 // dot centre → city text
// Marker centre → progress label. The far gap is for lines near 45°: they pass only 8.5px
// from the corner of every label spot at the near gap.
const LABEL_GAPS = [36, 52]
const DATA_SIZE: Record<Orientation, { w: number; h: number }> = {
  row: { w: 464, h: 68 },
  column: { w: 150, h: 268 },
}

// Clearances
const CITY_LINE_CLEARANCE = 10
const LABEL_LINE_CLEARANCE = 11
const LABEL_LINE_CLEARANCE_DENSE = 10 // between planning samples
const CORNER_LINE_CLEARANCE = 16
const OBSTACLE_PADDING = 8
const SWEEP_PADDING = 16 // the label moves between planning samples

// Search
const ROUTE_STEPS = 96
const PLAN_SAMPLES = 48
const VERIFY_SAMPLES = 200
const SCALE_STEP = 0.98
const MAX_SCALE = 12 // Melbourne-Hobart needs about 8
const MIN_SCALE = 0.25 // the whole world
const MAX_EVALUATIONS = 60000
const MAX_MAP_JUMP = 200 // map units between two route points

// Label plan costs: stay put unless another spot is better for a long part of the flight
const SWITCH_ANCHOR_COST = 8
const SWITCH_ROWS_COST = 3
const INFEASIBLE_COST = 100
const ANCHOR_COST: Record<LabelAnchor, number> = {
  'above-end': 0,
  'above-start': 0.1,
  'right-top': 0.2,
  'left-bottom': 0.2,
  'right-bottom': 0.3,
  'left-top': 0.3,
  'below-end': 0.4,
  'below-start': 0.4,
}
const ANCHORS = Object.keys(ANCHOR_COST) as LabelAnchor[]

const CITY_POSITIONS: { placement: CitySide; align: 'start' | 'end' }[] = [
  { placement: 'above', align: 'end' },
  { placement: 'above', align: 'start' },
  { placement: 'below', align: 'end' },
  { placement: 'below', align: 'start' },
  { placement: 'right', align: 'start' },
  { placement: 'left', align: 'end' },
]

// In order of preference
const DATA_OPTIONS: { corner: Corner; orientation: Orientation }[] = [
  { corner: 'top-left', orientation: 'column' },
  { corner: 'bottom-right', orientation: 'row' },
  { corner: 'top-right', orientation: 'row' },
  { corner: 'top-right', orientation: 'column' },
  { corner: 'top-left', orientation: 'row' },
  { corner: 'bottom-left', orientation: 'row' },
  { corner: 'bottom-left', orientation: 'column' },
  { corner: 'bottom-right', orientation: 'column' },
]
const CLOCK_CORNERS: Corner[] = [
  'bottom-right',
  'top-left',
  'top-right',
  'bottom-left',
]

const WIDEST_DIGIT = '0'

const overlaps = (a: Rect, b: Rect, padding = 0) =>
  a.x < b.x + b.w + padding &&
  a.x + a.w + padding > b.x &&
  a.y < b.y + b.h + padding &&
  a.y + a.h + padding > b.y

const inside = (r: Rect, b: Rect) =>
  r.x >= b.x && r.y >= b.y && r.x + r.w <= b.x + b.w && r.y + r.h <= b.y + b.h

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

function cornerRect(corner: Corner, size: { w: number; h: number }): Rect {
  return {
    x: corner.endsWith('left') ? SAFE.x : SAFE.x + SAFE.w - size.w,
    y: corner.startsWith('top') ? SAFE.y : SAFE.y + SAFE.h - size.h,
    ...size,
  }
}

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

function labelRect(
  anchor: LabelAnchor,
  size: { w: number; h: number },
  m: Point,
  gap: number
): Rect {
  const { w, h } = size
  const [side, end] = anchor.split('-')
  const x =
    side === 'left'
      ? m.x - gap - w
      : side === 'right'
        ? m.x + gap
        : end === 'end'
          ? m.x + DOT_RADIUS - w
          : m.x - DOT_RADIUS
  const y =
    side === 'above'
      ? m.y - gap - h
      : side === 'below'
        ? m.y + gap
        : end === 'bottom'
          ? m.y + DOT_RADIUS - h
          : m.y - DOT_RADIUS
  return { x, y, w, h }
}

/** Text hugs the marker side of the label box. */
const labelAlign = (anchor: LabelAnchor): 'left' | 'right' =>
  anchor === 'right-top' ||
  anchor === 'right-bottom' ||
  anchor === 'above-start' ||
  anchor === 'below-start'
    ? 'left'
    : 'right'

/** Points along the route, evenly spaced by length on screen. */
function resample(line: Point[], count: number): Point[] {
  const lengths = [0]
  for (let i = 1; i < line.length; i++)
    lengths.push(
      lengths[i - 1] +
        Math.hypot(line[i].x - line[i - 1].x, line[i].y - line[i - 1].y)
    )
  const total = lengths[lengths.length - 1]
  let segment = 1
  return Array.from({ length: count + 1 }, (_, i) => {
    const target = (i / count) * total
    while (segment < line.length - 1 && lengths[segment] < target) segment++
    const span = lengths[segment] - lengths[segment - 1] || 1
    const t = (target - lengths[segment - 1]) / span
    return {
      x: line[segment - 1].x + (line[segment].x - line[segment - 1].x) * t,
      y: line[segment - 1].y + (line[segment].y - line[segment - 1].y) * t,
    }
  })
}

/** Step 0: the route on the first world map that shows it without a jump. */
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
  const onMap = (map: WorldMap) => {
    const points = geo.map((p) => map.fromSource(projectToSource(p)))
    const steps = points
      .slice(1)
      .map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y))
    return { map, points, jump: Math.max(...steps) }
  }
  const options = WORLD_MAPS.map(onMap)
  const best = options.reduce((a, b) =>
    a.jump <= MAX_MAP_JUMP || a.jump <= b.jump ? a : b
  )
  return { ...best, points: closeSeam(best.points) }
}

/**
 * The map does not join perfectly at its seam, so a route crossing it jumps. Spread the
 * jump over the part of the route before it, keeping both ends on their real positions.
 */
function closeSeam(points: Point[]): Point[] {
  const steps = points
    .slice(1)
    .map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y))
  const typical = steps.slice().sort((a, b) => a - b)[steps.length >> 1]
  const seam = steps.findIndex((step) => step > Math.max(4 * typical, 8))
  if (seam < 1) return points
  const dx =
    points[seam + 1].x - points[seam].x - (points[seam].x - points[seam - 1].x)
  const dy =
    points[seam + 1].y - points[seam].y - (points[seam].y - points[seam - 1].y)
  return points.map((p, i) => {
    if (i > seam) return p
    const t = i / seam
    return { x: p.x + dx * t, y: p.y + dy * t }
  })
}

export function computeLayout(flight: Flight): SceneLayout {
  const { map, points: mapPoints, jump } = routeOnMap(flight)
  const start = mapPoints[0]
  const end = mapPoints[mapPoints.length - 1]

  // Text sizes: digits differ in width, so size for the widest digit, not for today's value
  const full = createFlightModel(flight).readoutAt(0)
  const widest = (text: string) => text.replace(/\d/g, WIDEST_DIGIT)
  const citySize = ({ city, label }: Flight['origin']) => ({
    w: Math.max(textWidth(city, 52, 600), textWidth(label, 36, 600)),
    h: 96,
  })
  const originSize = citySize(flight.origin)
  const destinationSize = citySize(flight.destination)
  const timeWidth =
    textWidth('in', 52, 600) +
    12 +
    Math.max(
      textWidth(widest(full.remaining), 52, 600),
      textWidth('00 min', 52, 600)
    )
  const kmWidth = textWidth(widest(`${full.km} km`), 36, 600)
  const miWidth = textWidth(widest(`${full.miles} mi`), 36, 400)
  const clockSize = { w: textWidth(widest('00:00'), 36, 600), h: 36 }
  const labelSizes: Record<1 | 2, { w: number; h: number }> = {
    1: { w: Math.max(timeWidth, kmWidth + 16 + miWidth), h: 96 },
    2: { w: Math.max(timeWidth, kmWidth, miWidth), h: 140 },
  }
  const states = ANCHORS.flatMap((anchor) =>
    ([1, 2] as const).flatMap((rows) =>
      LABEL_GAPS.map((gap) => ({ anchor, rows, gap }))
    )
  )

  /** The largest scale at which route and cities fit the safe zone, and the room left. */
  const fit = (originOffset: Rect, destinationOffset: Rect) => {
    const extent = (s: number, axis: 'x' | 'y') => {
      const size = axis === 'x' ? 'w' : 'h'
      let lo = Infinity
      let hi = -Infinity
      for (const p of mapPoints) {
        lo = Math.min(lo, s * p[axis] - LINE_RADIUS)
        hi = Math.max(hi, s * p[axis] + LINE_RADIUS)
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
        x: [SAFE.x - x.lo, SAFE.x + SAFE.w - x.hi] as const,
        y: [SAFE.y - y.lo, SAFE.y + SAFE.h - y.hi] as const,
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

  /** Step 2: where the progress label sits along the whole flight. */
  const planLabel = (
    line: Point[],
    obstacles: Rect[],
    soft: boolean
  ): { steps: LabelStep[]; sweep: Rect[] } | null => {
    const samples = resample(line, PLAN_SAMPLES)
    const costs: number[][] = []
    for (const marker of samples) {
      let any = false
      const row = states.map(({ anchor, rows, gap }) => {
        const r = labelRect(anchor, labelSizes[rows], marker, gap)
        const ok =
          inside(r, SAFE) &&
          clearOfLine(r, line, LABEL_LINE_CLEARANCE) &&
          !obstacles.some((o) => overlaps(r, o, OBSTACLE_PADDING))
        if (!ok) return soft ? INFEASIBLE_COST : Infinity
        any = true
        const toEdge = Math.min(
          r.x - SAFE.x,
          r.y - SAFE.y,
          SAFE.x + SAFE.w - r.x - r.w,
          SAFE.y + SAFE.h - r.y - r.h
        )
        return (
          ANCHOR_COST[anchor] +
          (rows === 2 ? 0.1 : 0) +
          (gap === LABEL_GAPS[0] ? 0 : 0.15) +
          toEdge / 300
        )
      })
      if (!any && !soft) return null
      costs.push(row)
    }

    // Cheapest sequence of label positions
    let best = costs[0].slice()
    const back: number[][] = []
    for (let i = 1; i < costs.length; i++) {
      const next = new Array<number>(states.length).fill(Infinity)
      const from = new Array<number>(states.length).fill(0)
      for (let to = 0; to < states.length; to++) {
        if (costs[i][to] === Infinity) continue
        for (let f = 0; f < states.length; f++) {
          if (best[f] === Infinity) continue
          const change =
            f === to
              ? 0
              : states[f].anchor === states[to].anchor
                ? SWITCH_ROWS_COST
                : SWITCH_ANCHOR_COST
          const cost = best[f] + change + costs[i][to]
          if (cost < next[to]) {
            next[to] = cost
            from[to] = f
          }
        }
      }
      back.push(from)
      best = next
    }
    let state = best.indexOf(Math.min(...best))
    if (best[state] === Infinity) return null
    const chosen = [state]
    for (let i = back.length - 1; i >= 0; i--) {
      state = back[i][state]
      chosen.unshift(state)
    }

    const steps: LabelStep[] = []
    const sweep: Rect[] = []
    chosen.forEach((index, i) => {
      const { anchor, rows, gap } = states[index]
      const rect = labelRect(anchor, labelSizes[rows], samples[i], gap)
      sweep.push(rect)
      if (i === 0 || chosen[i - 1] !== index)
        steps.push({
          from: i === 0 ? 0 : (i - 0.5) / PLAN_SAMPLES,
          dx: rect.x - samples[i].x,
          dy: rect.y - samples[i].y,
          w: rect.w,
          h: rect.h,
          align: labelAlign(anchor),
          rows,
        })
    })
    return { steps, sweep }
  }

  /** The plan must also hold between its samples. */
  const planHolds = (steps: LabelStep[], line: Point[], obstacles: Rect[]) =>
    resample(line, VERIFY_SAMPLES).every((marker, i) => {
      const share = i / VERIFY_SAMPLES
      const step = steps.reduce((a, b) => (b.from <= share ? b : a))
      const r = {
        x: marker.x + step.dx,
        y: marker.y + step.dy,
        w: step.w,
        h: step.h,
      }
      return (
        inside(r, SAFE) &&
        clearOfLine(r, line, LABEL_LINE_CLEARANCE_DENSE) &&
        !obstacles.some((o) => overlaps(r, o))
      )
    })

  /** Step 3: flight data and clock go in free corners. */
  const placeCorners = (
    occupied: Rect[],
    line: Point[],
    only: (typeof DATA_OPTIONS)[number][] = DATA_OPTIONS
  ) => {
    const isFree = (r: Rect) =>
      clearOfLine(r, line, CORNER_LINE_CLEARANCE) &&
      !occupied.some((o) => overlaps(r, o, SWEEP_PADDING))
    for (const option of only) {
      const dataRect = cornerRect(option.corner, DATA_SIZE[option.orientation])
      if (!isFree(dataRect)) continue
      for (const corner of CLOCK_CORNERS) {
        const clockRect = cornerRect(corner, clockSize)
        if (isFree(clockRect) && !overlaps(clockRect, dataRect, SWEEP_PADDING))
          return { flightData: option, clock: { corner } }
      }
    }
    return null
  }

  // Step 1 ↔ 2 ↔ 3: try the largest scale first, and shrink until everything fits
  const combos = CITY_POSITIONS.flatMap((originPosition) =>
    CITY_POSITIONS.map((destinationPosition) => {
      const originOffset = cityOffset(originPosition, originSize)
      const destinationOffset = cityOffset(destinationPosition, destinationSize)
      return {
        originPosition,
        destinationPosition,
        originOffset,
        destinationOffset,
        ...fit(originOffset, destinationOffset),
      }
    })
  )
  const scaleTop = Math.max(...combos.map((c) => c.maxScale))

  const toScene = (s: number, tx: number, ty: number) =>
    mapPoints.map((p) => ({ x: s * p.x + tx, y: s * p.y + ty }))
  const slack = ([lo, hi]: readonly [number, number]) =>
    hi - lo < 4 ? [(lo + hi) / 2] : [lo, (lo + hi) / 2, hi]

  type Candidate = {
    s: number
    tx: number
    ty: number
    combo: (typeof combos)[number]
    steps: LabelStep[]
    corners: NonNullable<ReturnType<typeof placeCorners>>
    score: number
  }

  let evaluations = 0
  const rejected = { cities: 0, label: 0, corners: 0, between: 0 }
  let found: Candidate | null = null
  for (
    let s = scaleTop;
    s >= MIN_SCALE && !found && evaluations < MAX_EVALUATIONS;
    s *= SCALE_STEP
  ) {
    for (const combo of combos) {
      if (combo.maxScale < s) continue
      const room = combo.room(s)
      for (const tx of slack(room.x))
        for (const ty of slack(room.y)) {
          if (evaluations >= MAX_EVALUATIONS) continue
          evaluations++
          const line = toScene(s, tx, ty)
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
          if (
            !clearOfLine(cityA, line, CITY_LINE_CLEARANCE) ||
            !clearOfLine(cityB, line, CITY_LINE_CLEARANCE) ||
            overlaps(cityA, cityB, OBSTACLE_PADDING) ||
            overlaps(cityA, dotRect(dotB), OBSTACLE_PADDING) ||
            overlaps(cityB, dotRect(dotA), OBSTACLE_PADDING)
          ) {
            rejected.cities++
            continue
          }

          const fixed = [cityA, cityB, dotRect(dotA), dotRect(dotB)]
          let plan = planLabel(line, fixed, false)
          if (!plan) {
            rejected.label++
            continue
          }
          let corners = placeCorners([...fixed, ...plan.sweep], line)
          // No free corner: reserve one up front and plan the label around it
          for (let i = 0; !corners && i < DATA_OPTIONS.length; i++) {
            const option = DATA_OPTIONS[i]
            const reserved = cornerRect(
              option.corner,
              DATA_SIZE[option.orientation]
            )
            const retry = planLabel(line, [...fixed, reserved], false)
            if (!retry) continue
            const placed = placeCorners([...fixed, ...retry.sweep], line, [
              option,
            ])
            if (placed) {
              plan = retry
              corners = placed
            }
          }
          if (!corners) {
            rejected.corners++
            continue
          }
          if (!planHolds(plan.steps, line, fixed)) {
            rejected.between++
            continue
          }

          // "As close to the bounding box as possible"
          const toEdges = (r: Rect) =>
            Math.min(
              r.x - SAFE.x,
              r.y - SAFE.y,
              SAFE.x + SAFE.w - r.x - r.w,
              SAFE.y + SAFE.h - r.y - r.h
            )
          const score =
            toEdges(cityA) + toEdges(cityB) + 10 * (plan.steps.length - 1)
          if (!found || score < found.score)
            found = { s, tx, ty, combo, steps: plan.steps, corners, score }
        }
    }
  }

  const warnings: string[] = []
  if (jump > MAX_MAP_JUMP)
    warnings.push(
      'The route crosses the seam of every map: it is bent to bridge a gap in the map.'
    )

  // Nothing fits every rule: keep the largest sensible layout and say so
  if (!found) {
    warnings.push('No layout satisfies all rules: some components may collide.')
    const combo = combos.reduce((a, b) => (b.maxScale > a.maxScale ? b : a))
    const s = Math.max(combo.maxScale * 0.7, MIN_SCALE)
    const room = combo.room(s)
    const tx = (room.x[0] + room.x[1]) / 2
    const ty = (room.y[0] + room.y[1]) / 2
    const line = toScene(s, tx, ty)
    const plan = planLabel(line, [], true)
    found = {
      s,
      tx,
      ty,
      combo,
      steps: plan?.steps ?? [],
      corners: {
        flightData: DATA_OPTIONS[0],
        clock: { corner: CLOCK_CORNERS[0] },
      },
      score: 0,
    }
  }

  const { s, tx, ty, combo, steps, corners } = found
  const line = toScene(s, tx, ty)
  const box = {
    left: (tx / SCENE.w) * 100,
    top: (ty / SCENE.h) * 100,
    width: ((s * map.width) / SCENE.w) * 100,
    height: ((s * map.height) / SCENE.h) * 100,
  }
  if (box.left > 0 || box.left + box.width < 100)
    warnings.push(
      'The map does not reach the left and right edges of the scene.'
    )

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
    map: { src: map.src, box },
    route: `M${line.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L')}`,
    origin: place(flight.origin, line[0], combo.originPosition),
    destination: place(
      flight.destination,
      line[line.length - 1],
      combo.destinationPosition
    ),
    label: { kind: 'plan', steps },
    flightData: corners.flightData,
    clock: corners.clock,
    report: { scale: s, evaluations, rejected, warnings },
  }
}
