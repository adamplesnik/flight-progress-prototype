import type { SceneLayout } from '../data/types'
import { WORLD } from '../layout/projection'

/** Design size of the 4:3 scene; route geometry and dots are in these pixels. */
export const SCENE = { w: 1024, h: 768 }

/** The scene as a window on the world map: its viewBox, and the copies of the map it shows. */
export function mapView({ x, y, scale }: SceneLayout['map']) {
  const width = SCENE.w / scale
  // One more on each side: Russia and Fiji reach over the side of their copy
  const first = Math.floor(x / WORLD.size) - 1
  const last = Math.floor((x + width) / WORLD.size) + 1
  return {
    viewBox: `${x} ${y} ${width} ${SCENE.h / scale}`,
    copies: Array.from({ length: last - first + 1 }, (_, i) => first + i),
  }
}
