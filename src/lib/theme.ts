/** 'system' follows the viewer's light or dark setting */
export type Theme = 'light' | 'dark' | 'system'

/** What the root of FlightMap and FlightPlayer has: style.css hangs everything on these */
export const rootProps = (name: string, theme?: Theme, className = '') => ({
  className: `flight-progress ${name} ${className}`.trimEnd(),
  'data-theme': theme === 'system' ? undefined : theme,
})
