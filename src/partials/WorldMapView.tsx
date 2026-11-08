import { useEffect, useState, type CSSProperties } from 'react'
import type { SceneLayout } from '../data/types'
import { WORLD } from '../layout/projection'
import { mapView } from './scene'

let content = ''

/**
 * Safari draws a line that follows a closepath (`zl`, as SVGO writes it) from the wrong point,
 * leaving long stray lines. An explicit move to the subpath's start (`m0 0`) is equivalent.
 */
const safariSafe = (svg: string) =>
  svg.replace(
    /\bd="([^"]*)"/g,
    (_, d: string) => `d="${d.replace(/z(?=[^mz])/gi, 'z m0 0')}"`
  )

/**
 * The world map, inline rather than an <img>: only then can its outlines keep their
 * weight when zoomed in. Up to 1× they scale down with the map.
 */
export function WorldMapView({ map }: { map: SceneLayout['map'] }) {
  const [, setLoaded] = useState(false)
  useEffect(() => {
    if (content) return
    let cancelled = false
    fetch(WORLD.src)
      .then((response) => response.text())
      .then((svg) => {
        content = safariSafe(
          svg.replace(/^[\s\S]*?<svg[^>]*>|<\/svg>\s*$/g, '')
        )
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const { viewBox, copies } = mapView(map)
  const repeats = copies
    .filter((copy) => copy !== 0)
    .map((copy) => `<use href="#world" x="${copy * WORLD.size}"/>`)
    .join('')
  return (
    <svg
      className="world-map"
      style={{ '--map-stroke': Math.min(1, 1 / map.scale) } as CSSProperties}
      viewBox={viewBox}
      aria-hidden="true"
      dangerouslySetInnerHTML={{
        __html: `<g id="world">${content}</g>${repeats}`,
      }}
    />
  )
}
