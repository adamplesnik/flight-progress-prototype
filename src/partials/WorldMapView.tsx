import { useEffect, useState, type CSSProperties } from 'react'
import type { SceneLayout } from '../data/types'
import { WORLD_MAPS } from '../layout/projection'
import { boxStyle, SCENE } from './scene'

const contents = new Map<string, string>()

/**
 * The world map, inline rather than an <img>: only then can its outlines keep their
 * weight when zoomed in. Up to 1× they scale down with the map.
 */
export function WorldMapView({
  map: { src, box },
}: {
  map: SceneLayout['map']
}) {
  const [, setLoaded] = useState(0)
  useEffect(() => {
    if (contents.has(src)) return
    let cancelled = false
    fetch(src)
      .then((response) => response.text())
      .then((svg) => {
        contents.set(src, svg.replace(/^[\s\S]*?<svg[^>]*>|<\/svg>\s*$/g, ''))
        if (!cancelled) setLoaded((n) => n + 1)
      })
    return () => {
      cancelled = true
    }
  }, [src])

  const world = WORLD_MAPS.find((m) => m.src === src) ?? WORLD_MAPS[0]
  const scale = ((box.width / 100) * SCENE.w) / world.width
  const style = {
    ...boxStyle(box),
    '--map-stroke': Math.min(1, 1 / scale),
  } as CSSProperties
  return (
    <svg
      className="world-map"
      style={style}
      viewBox={`0 0 ${world.width} ${world.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: contents.get(src) ?? '' }}
    />
  )
}
