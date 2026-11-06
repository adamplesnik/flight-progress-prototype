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
  MAX_LAT,
  project,
  WORLD,
  type LatLon,
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
const MIN_SIDE = 0.15 // sine of the angle to the path below which a spot is on neither side

// Search
const ROUTE_STEPS = 96
const PLAN_SAMPLES = 48
const VERIFY_SAMPLES = 200
const SCALE_STEP = 0.98
const MAX_SCALE = 12 // Melbourne-Hobart needs about 8
const MIN_SCALE = 0.12 // the map repeats sideways, so routes half the world long fit too
const MAX_EVALUATIONS = 60000
const COARSE_STOPS = [1] // shares of the way from the centre to the limit of the room
const FINE_STOPS = [0.25, 0.5, 0.75, 1]
const REFINE_STEPS = 7
const LABEL_MOVE_COST = 10 // px off centre worth accepting to save one label move
const DATA_OPTION_COST = 1 // px off centre worth accepting per step down DATA_OPTIONS

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
/**
 * Where the path's middle belongs: the centre of the scene without the side the flight data
 * takes. A row takes height, a column takes width.
 */
const centreFor = ({
  corner,
  orientation,
}: (typeof DATA_OPTIONS)[number]): Point => {
  const { w, h } = DATA_SIZE[orientation]
  return orientation === 'row'
    ? {
        x: SCENE.w / 2,
        y: (SCENE.h - h) / 2 + (corner.startsWith('top') ? h : 0),
      }
    : {
        x: (SCENE.w - w) / 2 + (corner.endsWith('left') ? w : 0),
        y: SCENE.h / 2,
      }
}

// The clock is always diagonally opposite the flight data
const CLOCK_CORNER: Record<Corner, Corner> = {
  'top-left': 'bottom-right',
  'top-right': 'bottom-left',
  'bottom-left': 'top-right',
  'bottom-right': 'top-left',
}

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

/**
 * Which side of the direction of travel a rectangle lies on: positive or negative, as the
 * sine of its angle to that direction (near 0 = straight ahead or behind, so on neither).
 */
const sideOfPath = (from: Point, to: Point, at: Point, r: Rect) => {
  const tx = to.x - from.x
  const ty = to.y - from.y
  const ox = r.x + r.w / 2 - at.x
  const oy = r.y + r.h / 2 - at.y
  return (tx * oy - ty * ox) / (Math.hypot(tx, ty) * Math.hypot(ox, oy) || 1)
}

/** The label is on the other side of the path than the cities (`citySide` is 1 or -1). */
const onLabelSide = (
  line: Point[],
  i: number,
  marker: Point,
  r: Rect,
  citySide: number
) =>
  sideOfPath(
    line[Math.max(i - 1, 0)],
    line[Math.min(i + 1, line.length - 1)],
    marker,
    r
  ) *
    citySide <
  -MIN_SIDE

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

  // Text sizes: digits differ in width, so size for the widest digit, not for today's value
  const widest = (text: string) => text.replace(/\d/g, WIDEST_DIGIT)
  const citySize = ({ city, label }: Flight['origin']) => ({
    w: Math.max(textWidth(city, 52, 600), textWidth(label, 36, 600)),
    h: 96,
  })
  const originSize = citySize(flight.origin)
  const destinationSize = citySize(flight.destination)
  const clockSize = { w: textWidth(widest('00:00'), 36, 600), h: 36 }
  // The label's size follows its text along the flight, so what touches the safe zone is
  // the text itself. Digits differ in width, so each value is sized for the widest digit.
  const model = createFlightModel(flight)
  const labelSizeTable = Array.from({ length: VERIFY_SAMPLES + 1 }, (_, i) => {
    let low = 0
    let high = 1
    for (let k = 0; k < 20; k++) {
      const mid = (low + high) / 2
      if (model.distanceProgressAt(mid) < i / VERIFY_SAMPLES) low = mid
      else high = mid
    }
    const { remaining, km, miles } = model.readoutAt(high)
    const time =
      textWidth('in', 52, 600) + 12 + textWidth(widest(remaining), 52, 600)
    const kmWidth = textWidth(widest(`${km} km`), 36, 600)
    const miWidth = textWidth(widest(`${miles} mi`), 36, 400)
    return {
      1: { w: Math.max(time, kmWidth + 16 + miWidth), h: 96 },
      2: { w: Math.max(time, kmWidth, miWidth), h: 140 },
    }
  })
  const labelSizeAt = (share: number, rows: 1 | 2) =>
    labelSizeTable[Math.round(share * VERIFY_SAMPLES)][rows]
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
    citySide: number,
    soft: boolean
  ): { steps: LabelStep[]; sweep: Rect[] } | null => {
    const samples = resample(line, PLAN_SAMPLES)
    const costs: number[][] = []
    for (const [i, marker] of samples.entries()) {
      let any = false
      const row = states.map(({ anchor, rows, gap }) => {
        const r = labelRect(
          anchor,
          labelSizeAt(i / PLAN_SAMPLES, rows),
          marker,
          gap
        )
        const ok =
          inside(r, SAFE) &&
          onLabelSide(samples, i, marker, r, citySide) &&
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
      const rect = labelRect(
        anchor,
        labelSizeAt(i / PLAN_SAMPLES, rows),
        samples[i],
        gap
      )
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
  const planHolds = (
    steps: LabelStep[],
    line: Point[],
    obstacles: Rect[],
    citySide: number
  ) => {
    const markers = resample(line, VERIFY_SAMPLES)
    return markers.every((marker, i) => {
      const share = i / VERIFY_SAMPLES
      const step = steps.reduce((a, b) => (b.from <= share ? b : a))
      // The text stays against the marker side of the box as it changes width
      const { w } = labelSizeAt(share, step.rows)
      const r = {
        x: marker.x + step.dx + (step.align === 'right' ? step.w - w : 0),
        y: marker.y + step.dy,
        w,
        h: step.h,
      }
      return (
        inside(r, SAFE) &&
        onLabelSide(markers, i, marker, r, citySide) &&
        clearOfLine(r, line, LABEL_LINE_CLEARANCE_DENSE) &&
        !obstacles.some((o) => overlaps(r, o))
      )
    })
  }

  /** Step 3: the flight data options whose corner, and the clock's opposite one, are free. */
  const freeDataOptions = (
    occupied: Rect[],
    line: Point[],
    only: (typeof DATA_OPTIONS)[number][] = DATA_OPTIONS
  ) => {
    const isFree = (r: Rect) =>
      clearOfLine(r, line, CORNER_LINE_CLEARANCE) &&
      !occupied.some((o) => overlaps(r, o, SWEEP_PADDING))
    return only.filter(
      (option) =>
        isFree(cornerRect(option.corner, DATA_SIZE[option.orientation])) &&
        isFree(cornerRect(CLOCK_CORNER[option.corner], clockSize))
    )
  }

  // Both cities go on one side of the path: the side is known from the route's direction
  // at each end, whatever the scale
  const lookAhead = Math.min(3, mapPoints.length - 1)
  const zero = { x: 0, y: 0 }
  const sideAtEnd = (from: Point, to: Point, offset: Rect) => {
    const side = sideOfPath(from, to, zero, offset)
    return Math.abs(side) < MIN_SIDE ? 0 : Math.sign(side)
  }

  // Step 1 ↔ 2 ↔ 3: try the largest scale first, and shrink until everything fits
  const combos = CITY_POSITIONS.flatMap((originPosition) =>
    CITY_POSITIONS.flatMap((destinationPosition) => {
      const originOffset = cityOffset(originPosition, originSize)
      const destinationOffset = cityOffset(destinationPosition, destinationSize)
      const citySide = sideAtEnd(start, mapPoints[lookAhead], originOffset)
      const sameSide =
        citySide !== 0 &&
        citySide ===
          sideAtEnd(
            mapPoints[mapPoints.length - 1 - lookAhead],
            end,
            destinationOffset
          )
      if (!sameSide) return []
      return {
        originPosition,
        destinationPosition,
        originOffset,
        destinationOffset,
        citySide,
        ...fit(originOffset, destinationOffset),
      }
    })
  )
  const scaleTop = Math.max(...combos.map((c) => c.maxScale))

  const toScene = (s: number, tx: number, ty: number) =>
    mapPoints.map((p) => ({ x: s * p.x + tx, y: s * p.y + ty }))
  // Path alignment starts centred in the scene, then is tuned only as far as the clusters
  // require: the search tries spots at growing distance from the centre.
  const xs = mapPoints.map((p) => p.x)
  const ys = mapPoints.map((p) => p.y)
  const pathMiddle = {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  }
  const positions = (
    [lo, hi]: readonly [number, number],
    centres: number[],
    stops: number[]
  ) => {
    const list = centres.flatMap((centre) => {
      const start = Math.min(Math.max(centre, lo), hi)
      return [
        start,
        ...stops.flatMap((f) => [
          start + (lo - start) * f,
          start + (hi - start) * f,
        ]),
      ]
    })
    return list.filter(
      (v, i) => list.findIndex((other) => Math.abs(other - v) < 1) === i
    )
  }
  const centres = DATA_OPTIONS.map(centreFor)
  const centreXs = [...new Set(centres.map((c) => c.x))]
  const centreYs = [...new Set(centres.map((c) => c.y))]

  type Combo = (typeof combos)[number]
  type Candidate = {
    s: number
    tx: number
    ty: number
    combo: Combo
    steps: LabelStep[]
    flightData: (typeof DATA_OPTIONS)[number]
    score: number
  }

  let evaluations = 0
  const rejected = { cities: 0, label: 0, corners: 0, between: 0 }

  const tryLayout = (
    s: number,
    combo: Combo,
    tx: number,
    ty: number
  ): Candidate | null => {
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
      return null
    }

    const fixed = [cityA, cityB, dotRect(dotA), dotRect(dotB)]
    let plan = planLabel(line, fixed, combo.citySide, false)
    if (!plan) {
      rejected.label++
      return null
    }
    let free = freeDataOptions([...fixed, ...plan.sweep], line)
    // No free corner: reserve one up front and plan the label around it
    for (let i = 0; free.length === 0 && i < DATA_OPTIONS.length; i++) {
      const option = DATA_OPTIONS[i]
      const reserved = cornerRect(option.corner, DATA_SIZE[option.orientation])
      const reservedClock = cornerRect(CLOCK_CORNER[option.corner], clockSize)
      const retry = planLabel(
        line,
        [...fixed, reserved, reservedClock],
        combo.citySide,
        false
      )
      if (!retry) continue
      const placed = freeDataOptions([...fixed, ...retry.sweep], line, [option])
      if (placed.length > 0) {
        plan = retry
        free = placed
      }
    }
    if (free.length === 0) {
      rejected.corners++
      return null
    }
    if (!planHolds(plan.steps, line, fixed, combo.citySide)) {
      rejected.between++
      return null
    }

    // The placement of the flight data that leaves the path most centred
    const costOf = (option: (typeof DATA_OPTIONS)[number]) => {
      const centre = centreFor(option)
      return (
        Math.abs(tx - (centre.x - s * pathMiddle.x)) +
        Math.abs(ty - (centre.y - s * pathMiddle.y)) +
        DATA_OPTION_COST * DATA_OPTIONS.indexOf(option)
      )
    }
    const flightData = free.reduce((a, b) => (costOf(b) < costOf(a) ? b : a))
    const score = costOf(flightData) + LABEL_MOVE_COST * (plan.steps.length - 1)
    return { s, tx, ty, combo, steps: plan.steps, flightData, score }
  }

  /** The most centred layout at this scale. */
  const bestAt = (s: number, options: Combo[], stops: number[]) => {
    let best: Candidate | null = null
    for (const combo of options) {
      if (combo.maxScale < s) continue
      const room = combo.room(s)
      const txs = positions(
        room.x,
        centreXs.map((x) => x - s * pathMiddle.x),
        stops
      )
      const tys = positions(
        room.y,
        centreYs.map((y) => y - s * pathMiddle.y),
        stops
      )
      for (const tx of txs)
        for (const ty of tys) {
          if (evaluations >= MAX_EVALUATIONS) return best
          const candidate = tryLayout(s, combo, tx, ty)
          if (candidate && (!best || candidate.score < best.score))
            best = candidate
        }
    }
    return best
  }

  // The largest scale that works, in coarse steps
  let found: Candidate | null = null
  let tooLarge = Infinity
  for (
    let s = scaleTop;
    s >= MIN_SCALE && !found && evaluations < MAX_EVALUATIONS;
    s *= SCALE_STEP
  ) {
    found = bestAt(s, combos, COARSE_STOPS)
    if (!found) tooLarge = s
  }
  // ...then closer, until something really touches the safe zone
  if (found) {
    let low = found.s
    let high = Math.min(tooLarge, found.combo.maxScale)
    for (let i = 0; i < REFINE_STEPS; i++) {
      const mid = (low + high) / 2
      const better = bestAt(mid, [found.combo], FINE_STOPS)
      if (better) {
        found = better
        low = mid
      } else high = mid
    }
  }

  const warnings: string[] = []
  if (leavesMap)
    warnings.push(
      `The route passes beyond ${MAX_LAT.toFixed(0)}° latitude, where the map ends: it is flattened along the map's edge.`
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
    const plan = planLabel(line, [], combo.citySide, true)
    found = {
      s,
      tx,
      ty,
      combo,
      steps: plan?.steps ?? [],
      flightData: DATA_OPTIONS[0],
      score: 0,
    }
  }

  const { s, tx, ty, combo, steps, flightData } = found
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
    labelSteps: steps,
    flightData,
    clock: { corner: CLOCK_CORNER[flightData.corner] },
    report: { scale: s, evaluations, rejected, warnings },
  }
}
