# flight-progress

React components that show a flight's progress on a world map, published to npm as
`flight-progress`, and the demo site built from the same components. React 19 + Vite +
Tailwind CSS v4. The README covers features, commands and how the layout works.

## Development Server

A Vite development server is **already running** on `$PORT` (default 8443). You don't need to start it manually.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Project Structure

Start with task-relevant files below. Only follow imports or inspect other files when required, when a documented path is missing, or when the repository contradicts this guide.

- `src/lib/` - The npm package: `index.ts` (its exports), `FlightMap`, `FlightPlayer`, `theme.ts`, and the stylesheets (`style.css` for the package, `scene.css` shared with the demo, `public/fonts.css` copied to the package as it is); `build.ts` is the package build's entry
- `src/partials/` - The scene's components, used by both the package and the demo
- `src/layout/` - Projection, the layout solver and text metrics
- `src/data/` - Flight data (`flights/`, one file per flight, listed in `flights/index.ts`) and types
- `src/main.tsx` - Demo entrypoint and router: `/:ORIG-DEST` shows a flight, `/capture` is for screenshots
- `src/App.tsx` - The demo page; `src/Capture.tsx` - the screenshot page
- `src/index.css` - The demo's CSS entrypoint
- `screens/` - `pnpm screens` writes screenshots into `public/screens/`, which the site serves at `/screens/<flight id>.png`; they are not in the npm package
- `vite.config.ts` - The demo build; `vite.lib.config.ts` and `tsconfig.lib.json` - the package build (`pnpm build:lib` into `dist-lib/`)
- `.mise.toml` - Toolchain versions for Node.js and pnpm

## Dependencies

- Runtime: React 19 and React DOM 19 (peer dependencies of the package), `@tabler/icons-react`, `clsx`, `@fontsource/inter`
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 8, TypeScript 5, and `@vitejs/plugin-react`
- Formatting: Prettier with `prettier-plugin-tailwindcss` (`pnpm format`)

## Styling

Tailwind runs with **`prefix(fp)`**, in both the package (`src/lib/style.css`) and the demo (`src/index.css`), so the package's CSS never meets a host app's own Tailwind:

- Write every utility with the prefix first: `fp:flex`, `fp:md:flex-row`, `fp:hover:bg-container`, `fp:[&::-moz-range-thumb]:size-7`
- Theme colours are defined unprefixed in `@theme` in `src/lib/scene.css` (`--color-main`), but Tailwind writes them as `--fp-color-main`. Refer to them as `var(--fp-color-main)` in CSS and arbitrary values. `.flight-progress` sets them for the light and dark theme
- Plain CSS for the scene goes in `src/lib/scene.css`, nested in `.flight-progress`, so no class name reaches the rest of the page
- The package's stylesheet has no Preflight; its reset in `src/lib/style.css` is scoped to `.flight-progress`. Global element styles for the demo go in `@layer base` in `src/index.css`
