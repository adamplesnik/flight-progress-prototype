# Flight progress prototype

A prototype of an in-flight map: the route between two cities on a world map, with the aircraft
moving along it and live flight data beside it — time and distance left, speed, altitude and
outside temperature.

**Demo:** [flights.adamplesnik.com](https://flights.adamplesnik.com)

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
| `pnpm build:lib` | Build the package into `dist-lib/` |
| `pnpm screens` | Remake `public/screens/` from `screens/positions.mjs`, with the dev server running |
| `pnpm format` | Format the sources with Prettier |
| `node scripts/generate-world-map.mjs` | Regenerate the world map and country names |

## Using the package

The components are published as [`flight-progress`](https://www.npmjs.com/package/flight-progress),
for React 19.

```sh
npm install flight-progress
```

```tsx
import { FlightMap, FlightPlayer, flights, lisZurich } from 'flight-progress'
import 'flight-progress/style.css'
import 'flight-progress/fonts.css' // unless the page loads Inter 400 and 600 already

// The whole view: the flight's name, the map in a rounded frame, play/pause and a slider
<FlightPlayer flight={lisZurich} />
<FlightPlayer flight={flight} flights={flights} onSelectFlight={setFlight} />

// Only the map, without border or rounded corners: animated, or held at a position
<FlightMap flight={lisZurich} />
<FlightMap flight={lisZurich} progress={0.4} theme="dark" />
```

Both take the full width of their parent, with the map at 4:3. `theme` is `'system'` (the
default), `'light'` or `'dark'`. `progress` and `initialProgress` are shares (0..1) of the
flight's timeline, which includes the time on the ground before take-off and after landing.
The world map, about 1.4 MB, loads as a chunk of its own after the first paint.

The package also exports the flights (`flights`, each by name, `flightById`, `findFlight`),
`flightTitle`, `flightPath` and the `Flight` type, so you can pass in flights of your own.

## Screenshots

Screenshots of every flight, 2048 × 1536, are in `public/screens/`, so the demo serves them at
`https://flights.adamplesnik.com/screens/<flight id>.png`, for example
[lis-zurich.png](https://flights.adamplesnik.com/screens/lis-zurich.png). They are not part of
the npm package.

`screens/positions.mjs` sets where each flight is caught, in percent of its timeline, and
`pnpm screens` (with the dev server running and Google Chrome installed) remakes
`public/screens/` from the `/capture` page.

## Adding a flight

Each flight is a file in `src/data/flights/`, listed in `src/data/flights/index.ts`; the menu
sorts them by title, and `defaultFlight` sets the one shown first. Each flight has its own
address from its airports' ICAO codes, like `/LPPT-LSZH`; any other address opens the default.
A flight has:

- `origin` and `destination` — `city`, airport `icao` code, local `time` and coordinates
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
- `src/lib/` — the package: its entry, `FlightMap`, `FlightPlayer` and stylesheets
- Tailwind runs with `prefix(fp)`: utilities are written `fp:flex`, `fp:md:flex-row`, and the
  theme colours are `--fp-color-*`. With the scene's own classes nested in `.flight-progress`,
  the package's stylesheet leaves the rest of the page, and its own Tailwind, alone
- `src/Capture.tsx` and `screens/` — the page and script that make the screenshots

## Built with

React 19, TypeScript, Vite and Tailwind CSS v4.

## Credits

- Map data: [Natural Earth](https://www.naturalearthdata.com/) (public domain), via
  [world-atlas](https://github.com/topojson/world-atlas)
- Typeface: [Inter](https://rsms.me/inter/) by Rasmus Andersson

## License

[MIT](LICENSE) © Adam Plesnik — [adamplesnik.com](https://adamplesnik.com)
