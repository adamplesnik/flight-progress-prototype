import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { Point } from './data/types'
import type { Variant } from './lib'

type Photo = {
  /** The photo by day and by night, from the same spot */
  src: { day: string; night: string }
  width: number
  height: number
  /** The screen's corners in the photo's px: top left, top right, bottom right, bottom left */
  screen: [Point, Point, Point, Point]
  /** Makes the scene look lit like the photo */
  className: string
}

/**
 * A cabin photo for each variant, with the screen where the scene goes. The corners were
 * found in the photos: the black screen's edges, each fitted with a straight line. The night
 * photos are the same shots, darker.
 */
const PHOTOS: Record<Variant, Photo> = {
  map: {
    src: { day: '/mockups/large-day.jpg', night: '/mockups/large-night.jpg' },
    width: 3000,
    height: 2000,
    screen: [
      { x: 820.5, y: 539 },
      { x: 1694.9, y: 663.6 },
      { x: 1631.9, y: 1355.8 },
      { x: 753.2, y: 1299.6 },
    ],
    className: 'mockup-large',
  },
  compact: {
    src: { day: '/mockups/small-day.jpg', night: '/mockups/small-night.jpg' },
    width: 3000,
    height: 2000,
    screen: [
      { x: 1434.8, y: 683.7 },
      { x: 1922.2, y: 477.2 },
      { x: 2088.7, y: 844.5 },
      { x: 1588.8, y: 1007.7 },
    ],
    className: 'mockup-small',
  },
}

/** The scene's size in CSS px inside the photo: its design size */
const SCENE_SIZE: Record<Variant, { w: number; h: number }> = {
  map: { w: 1024, h: 768 },
  compact: { w: 1152, h: 768 },
}

/**
 * The CSS matrix3d that maps the rectangle w × h at the origin onto the quad `to`
 * (a projective transform, Heckbert's square-to-quad, scaled to the rectangle).
 */
function quadTransform(w: number, h: number, to: Photo['screen']) {
  const [p0, p1, p2, p3] = to
  const dx1 = p1.x - p2.x
  const dx2 = p3.x - p2.x
  const dx3 = p0.x - p1.x + p2.x - p3.x
  const dy1 = p1.y - p2.y
  const dy2 = p3.y - p2.y
  const dy3 = p0.y - p1.y + p2.y - p3.y
  const den = dx1 * dy2 - dx2 * dy1
  const g = (dx3 * dy2 - dx2 * dy3) / den
  const hh = (dx1 * dy3 - dx3 * dy1) / den
  const a = p1.x - p0.x + g * p1.x
  const b = p3.x - p0.x + hh * p3.x
  const d = p1.y - p0.y + g * p1.y
  const e = p3.y - p0.y + hh * p3.y
  // Column by column
  const m = [
    [a / w, d / w, 0, g / w],
    [b / h, e / h, 0, hh / h],
    [0, 0, 1, 0],
    [p0.x, p0.y, 0, 1],
  ]
  return `matrix3d(${m.flat().join(',')})`
}

/**
 * The live scene on the screen of a cabin photo. The photo is laid out at its own size and
 * scaled to the width of the parent, the scene put into perspective on the screen.
 */
export function Mockup({
  variant,
  night = false,
  children,
}: {
  variant: Variant
  /** The cabin at night, its lights dimmed */
  night?: boolean
  children: ReactNode
}) {
  const photo = PHOTOS[variant]
  const size = SCENE_SIZE[variant]
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(() =>
      setScale(element.clientWidth / photo.width)
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [photo.width])

  return (
    <div
      ref={ref}
      className={`mockup ${photo.className} ${night ? 'night' : ''}`}
      style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
    >
      <div
        className="mockup-photo"
        style={{
          width: photo.width,
          height: photo.height,
          backgroundImage: `url(${photo.src[night ? 'night' : 'day']})`,
          transform: `scale(${scale})`,
        }}
      >
        <div
          className="mockup-screen"
          style={{
            width: size.w,
            height: size.h,
            transform: quadTransform(size.w, size.h, photo.screen),
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
