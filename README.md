# Flight progress prototype

A prototype of an in-flight map: the route between two cities on a world map, with the aircraft
moving along it and live flight data beside it — time and distance left, speed, altitude and
outside temperature.

Every flight is laid out automatically. The route is drawn on a Web Mercator map, the same
projection as Google's and Apple's flat maps, and a solver decides how far to zoom, where the
route sits and where the city names and data go, so that nothing overlaps.

## Features

- **Automatic layout** — the largest zoom at which the route, both city labels and the data fit
  a 48px safe zone, with the data in either a bottom row or a right column
- **Any route** — great circles by default, or a smooth curve through waypoints; routes across
  the date line continue onto the next copy of the map
- **Playback** — play, pause and a scrubbing slider that follows the flight
- **Responsive** — the controls stack on narrow screens, and the scene scales with its container
- **Light and dark mode** — following the system setting, through a small set of theme colours

## Getting started

Requires Node.js 22 and pnpm.

```sh
pnpm install
pnpm dev
```

The app runs at http://localhost:8443 (or the port in `PORT`).

| Command | What it does |
| --- | --- |
| `pnpm dev` | Development server with hot reload |
| `pnpm build` | Production build into `dist/` |
| `pnpm preview` | Serve the production build |
| `pnpm format` | Format `src/` with Prettier |
| `node scripts/generate-world-map.mjs` | Regenerate the world map and country names |

## Adding a flight

Each flight is a file in `src/data/flights/`, listed in `src/data/flights/index.ts`; the first
one in the list is the default. A flight has:

- `origin` and `destination` — city name, time label and coordinates
- `waypoints` (optional) — points the route passes through, joined by a smooth curve
- `profile` — speed, altitude, temperature and remaining distance at a fixed time step
- `timeline` — minutes on the ground before take-off and after landing, and taxiing

The flight profiles included are synthetic: plausible climbs, cruises and descents fitted to
each route's distance and duration, not recorded flight data.

## How it works

- `src/layout/projection.ts` — Web Mercator and great-circle maths
- `src/layout/computeLayout.ts` — the layout solver: tries the row and the column layout,
  centres the route and city labels in the space left, and keeps the larger zoom
- `src/layout/textMetrics.ts` — text widths for the solver, measured from the Inter font
- `src/partials/` — the scene's components: map, route, city labels, data panel and controls

## Built with

React 19, TypeScript, Vite and Tailwind CSS v4.

## Credits

- Map data: [Natural Earth](https://www.naturalearthdata.com/) (public domain), via
  [world-atlas](https://github.com/topojson/world-atlas)
- Typeface: [Inter](https://rsms.me/inter/) by Rasmus Andersson

## License

[MIT](LICENSE) © Adam Plesnik — [adamplesnik.com](https://adamplesnik.com)
