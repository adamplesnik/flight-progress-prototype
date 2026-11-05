import type { Corner } from '../data/types'
import { cornerClasses } from './scene'

export function LocalTime({
  clock,
  corner,
}: {
  clock: string
  corner: Corner
}) {
  return (
    <time className={`local-time ${cornerClasses(corner)}`} dateTime={clock}>
      {clock}
    </time>
  )
}
