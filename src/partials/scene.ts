import type { Box, Corner } from '../data/types'

/** Design size of the 4:3 scene; route geometry and dots are in these pixels. */
export const SCENE = { w: 1024, h: 768 }

export const boxStyle = ({ left, top, width, height }: Box) => ({
  left: `${left}%`,
  top: `${top}%`,
  width: `${width}%`,
  height: `${height}%`,
})

/** Classes that put an absolutely positioned component in a corner of the safe zone. */
export const cornerClasses = (corner: Corner) =>
  corner
    .split('-')
    .map((side) => `at-${side}`)
    .join(' ')
