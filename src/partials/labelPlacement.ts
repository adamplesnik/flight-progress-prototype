export type Point = { x: number; y: number }
export type Rect = { x: number; y: number; w: number; h: number }

export type LabelPlacement = {
  rect: Rect
  side: 'above' | 'below'
  align: 'left' | 'right'
}

const GAP = 36 // marker radius (24) + breathing room
const EDGE = 24 // how far the label extends past the marker's centre on its aligned side
const STEP = 8
const MAX_EXTRA = 200

const inside = (r: Rect, b: Rect) =>
  r.x >= b.x && r.y >= b.y && r.x + r.w <= b.x + b.w && r.y + r.h <= b.y + b.h

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

const hitsPath = (r: Rect, path: Point[], margin: number) =>
  path.some(
    (p) =>
      p.x > r.x - margin &&
      p.x < r.x + r.w + margin &&
      p.y > r.y - margin &&
      p.y < r.y + r.h + margin
  )

/**
 * Finds a spot for the progress label next to the marker at `marker`: inside `bounds`
 * (the safe zone), clear of the route line and of the `obstacles`. Tries the preferred
 * side first, nudging the label further away from the marker before giving up on a side.
 */
export function placeLabel({
  marker,
  size,
  prefer,
  path,
  pathMargin,
  obstacles,
  bounds,
}: {
  marker: Point
  size: { w: number; h: number }
  prefer: 'above' | 'below'
  path: Point[]
  pathMargin: number
  obstacles: Rect[]
  bounds: Rect
}): LabelPlacement {
  const sides: ('above' | 'below')[] =
    prefer === 'above' ? ['above', 'below'] : ['below', 'above']
  const aligns: ('right' | 'left')[] = ['right', 'left']

  const build = (
    side: 'above' | 'below',
    align: 'left' | 'right',
    extra: number
  ) => {
    const x = align === 'right' ? marker.x + EDGE - size.w : marker.x - EDGE
    const y =
      side === 'above'
        ? marker.y - GAP - extra - size.h
        : marker.y + GAP + extra
    return { rect: { x, y, w: size.w, h: size.h }, side, align }
  }

  // Stay on the preferred side as long as possible (nudging away from the marker)
  // before switching sides, so the label does not jump around.
  for (const side of sides) {
    for (let extra = 0; extra <= MAX_EXTRA; extra += STEP) {
      for (const align of aligns) {
        const candidate = build(side, align, extra)
        if (
          inside(candidate.rect, bounds) &&
          !hitsPath(candidate.rect, path, pathMargin) &&
          !obstacles.some((o) => overlaps(candidate.rect, o))
        )
          return candidate
      }
    }
  }
  return build(prefer, 'right', 0)
}
