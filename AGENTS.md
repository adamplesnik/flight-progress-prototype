# flight-progress

React components that show a flight's progress on a world map, published to npm as
`flight-progress`, and the demo site built from the same components. React 19 + Vite,
styled with plain CSS. The README covers features, commands and how the layout works.

## Development Server

A Vite development server is **already running** on `$PORT` (default 8443). You don't need to start it manually.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Project Structure

Start with task-relevant files below. Only follow imports or inspect other files when required, when a documented path is missing, or when the repository contradicts this guide.

- `src/lib/` - The npm package: `index.ts` (its exports), `FlightMap`, `FlightPlayer`, `theme.ts`, and the stylesheets (`style.css`, all the package's styles, which the demo imports too, and `public/fonts.css`, copied to the package as it is); `build.ts` is the package build's entry
- `src/partials/` - The scene's components, used by both the package and the demo
- `src/layout/` - Projection, the layout solver and text metrics
- `src/data/` - Flight data (`flights/`, one file per flight, listed in `flights/index.ts`) and types
- `src/main.tsx` - Demo entrypoint and router: `/:ORIG-DEST` shows a flight, `/capture` is for screenshots
- `src/App.tsx` - The demo page; `src/Capture.tsx` - the screenshot page
- `src/index.css` - The demo's CSS entrypoint: the fonts, `src/lib/style.css` and the page's own styles
- `screens/` - `pnpm screens` writes screenshots into `public/screens/`, which the site serves at `/screens/<flight id>.png`; they are not in the npm package
- `vite.config.ts` - The demo build; `vite.lib.config.ts` and `tsconfig.lib.json` - the package build (`pnpm build:lib` into `dist-lib/`)
- `.mise.toml` - Toolchain versions for Node.js and pnpm

## Dependencies

- Runtime: React 19 and React DOM 19 (peer dependencies of the package), `@tabler/icons-react`, `@fontsource/inter`
- Build tooling: Vite 8, TypeScript 5, and `@vitejs/plugin-react`
- Formatting: Prettier (`pnpm format`)

## Styling

Plain CSS, no framework. All the package's styles are in `src/lib/style.css`:

- Everything is nested in `.flight-progress`, the root of `FlightMap` and `FlightPlayer`, so no class name reaches the rest of the page. Components use short semantic class names (`scene`, `data-panel`, `controls`) and combine them in template strings
- The theme is the `--fp-color-*` custom properties on `.flight-progress`, each a `light-dark()` pair. `color-scheme` picks the side: the system's by default, or the `theme` prop's through `data-theme`
- The root's own rules are in `:where()`, so a class passed as `className` overrides them. The reset is scoped to `.flight-progress` too
- Sizes inside the scene are in `cqw`: the scene is 1024px wide by design, so 1px is 0.09765625cqw
- The demo's `<body>` has the `flight-progress` class, for the theme colours; the demo's own styles are classes in `src/index.css`
