import { useEffect, useState, type CSSProperties } from 'react'
import type { SceneLayout } from '../data/types'
import { WORLD } from '../layout/projection'
import { mapView } from './scene'

/** The two looks of the map: the same outlines, with the land and the sea coloured apart. */
export const MAP_STYLES = {
  light: { src: WORLD.src, sea: '#e9ebed' },
  gray: { src: '/assets/world-mercator-gray.svg', sea: '#ffffff' },
} as const

export type MapStyle = keyof typeof MAP_STYLES

/** Map contents by style, fetched once each. */
const contents = new Map<MapStyle, string>()

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
  // The style on screen: the previous one stays until the new one has loaded
  const [shown, setShown] = useState<MapStyle | null>(() =>
    contents.has(mapStyle) ? mapStyle : null
  )
  useEffect(() => {
    if (contents.has(mapStyle)) {
      setShown(mapStyle)
      return
    }
    let cancelled = false
    fetch(MAP_STYLES[mapStyle].src)
      .then((response) => response.text())
      .then((svg) => {
        contents.set(
          mapStyle,
          svg.replace(/^[\s\S]*?<svg[^>]*>|<\/svg>\s*$/g, '')
        )
        if (!cancelled) setShown(mapStyle)
      })
    return () => {
      cancelled = true
    }
  }, [mapStyle])

  const { viewBox, copies } = mapView(map)
  const repeats = copies
    .filter((copy) => copy !== 0)
    .map((copy) => `<use href="#world" x="${copy * WORLD.size}"/>`)
    .join('')
  const content = shown ? (contents.get(shown) ?? '') : ''
  return (
    <svg
      className="world-map"
      style={
        {
          '--map-stroke': Math.min(1, 1 / map.scale),
          '--sea': MAP_STYLES[shown ?? mapStyle].sea,
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
