import { useEffect, useState, type CSSProperties } from 'react'
import type { SceneLayout } from '../data/types'
import { WORLD } from '../layout/projection'
import { mapView } from './scene'

/** The two looks of the map: land and sea colours over the same outlines. */
export const MAP_STYLES = {
  light: { land: '#fafafa', sea: '#e9ebed' },
  gray: { land: '#e9ebed', sea: '#ffffff' },
} as const

export type MapStyle = keyof typeof MAP_STYLES

let content = ''

/**
 * The world map, inline rather than an <img>: only then can its outlines keep their
 * weight when zoomed in. Up to 1× they scale down with the map.
 */
export function WorldMapView({
  map,
  mapStyle,
}: {
  map: SceneLayout['map']
  mapStyle: MapStyle
}) {
  const [, setLoaded] = useState(false)
  useEffect(() => {
    if (content) return
    let cancelled = false
    fetch(WORLD.src)
      .then((response) => response.text())
      .then((svg) => {
        content = svg.replace(/^[\s\S]*?<svg[^>]*>|<\/svg>\s*$/g, '')
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
      style={
        {
          '--map-stroke': Math.min(1, 1 / map.scale),
          '--land': MAP_STYLES[mapStyle].land,
          '--sea': MAP_STYLES[mapStyle].sea,
        } as CSSProperties
      }
      viewBox={viewBox}
      aria-hidden="true"
      dangerouslySetInnerHTML={{
        __html: `<g id="world">${content}</g>${repeats}`,
      }}
    />
  )
}
