import type { Endpoint, Point, Side } from '../data/types'
import { SCENE } from './scene'

type Rect = { x: number; y: number; w: number; h: number }

export type LabelPlacement = {
  rect: Rect
  side: Side
  align: 'left' | 'right'
}

export const LABEL_SIZE = { w: 200, h: 140 }

const SAFE_MARGIN = 48
const SAFE_ZONE: Rect = {
  x: SAFE_MARGIN,
  y: SAFE_MARGIN,
  w: SCENE.w - 2 * SAFE_MARGIN,
  h: SCENE.h - 2 * SAFE_MARGIN,
}
const PATH_MARGIN = 20 // clearance from the centre of the route line
const PATH_SAMPLE_STEP = 4
const GAP = 36 // marker radius (24) + breathing room
const EDGE = 24 // how far the label extends past the marker's centre on its aligned side
const STEP = 8
const MAX_EXTRA = 200
const DOT_RADIUS = 24

const inside = (r: Rect, b: Rect) =>
  r.x >= b.x && r.y >= b.y && r.x + r.w <= b.x + b.w && r.y + r.h <= b.y + b.h

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

const hitsPath = (r: Rect, path: Point[]) =>
  path.some(
    (p) =>
      p.x > r.x - PATH_MARGIN &&
      p.x < r.x + r.w + PATH_MARGIN &&
      p.y > r.y - PATH_MARGIN &&
      p.y < r.y + r.h + PATH_MARGIN
  )

/** Rough area of a city cluster: its dot, and the city text below the dot. */
function clusterRect({ dot, city, label, align }: Endpoint): Rect {
  const w = Math.max(city.length * 31, label.length * 20)
  return {
    x: align === 'end' ? dot.x + DOT_RADIUS - w : dot.x - DOT_RADIUS,
    y: dot.y - DOT_RADIUS,
    w,
    h: 160,
  }
}

function samplePath(route: SVGPathElement): Point[] {
  const length = route.getTotalLength()
  const points: Point[] = []
  for (let d = 0; d <= length; d += PATH_SAMPLE_STEP) {
    const { x, y } = route.getPointAtLength(d)
    points.push({ x, y })
  }
  return points
}

/**
 * Returns a function that finds a spot for the progress label next to the marker: inside
 * the safe zone, clear of the route line and of the city clusters (below the dots).
 */
export function createLabelPlacer(route: SVGPathElement, cities: Endpoint[]) {
  const path = samplePath(route)
  const obstacles = cities.map(clusterRect)
  const isClear = (r: Rect) =>
    inside(r, SAFE_ZONE) &&
    !hitsPath(r, path) &&
    !obstacles.some((o) => overlaps(r, o))

  return (marker: Point): LabelPlacement => {
    const build = (
      side: Side,
      align: LabelPlacement['align'],
      extra: number
    ): LabelPlacement => ({
      rect: {
        x: align === 'right' ? marker.x + EDGE - LABEL_SIZE.w : marker.x - EDGE,
        y:
          side === 'above'
            ? marker.y - GAP - extra - LABEL_SIZE.h
            : marker.y + GAP + extra,
        ...LABEL_SIZE,
      },
      side,
      align,
    })

    // Stay above the marker as long as possible (nudging further away from it)
    // before switching sides, so the label does not jump around.
    for (const side of ['above', 'below'] as const) {
      for (let extra = 0; extra <= MAX_EXTRA; extra += STEP) {
        for (const align of ['right', 'left'] as const) {
          const candidate = build(side, align, extra)
          if (isClear(candidate.rect)) return candidate
        }
      }
    }
    return build('above', 'right', 0)
  }
}
