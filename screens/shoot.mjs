/**
 * Captures the map scene of each flight in positions.mjs at 1024 × 768, 2× (2048 × 1536 px),
 * into screens/images/<flight id>.png.
 *
 * Needs the dev server running and Google Chrome installed:
 *   pnpm screens
 * Optional environment: PORT (dev server, default 8443), CHROME_PATH (Chrome executable).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
import { positions } from './positions.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const flightsDir = path.join(here, '../src/data/flights')
const outDir = path.join(here, 'images')
const baseUrl = `http://localhost:${process.env.PORT ?? 8443}`
const chrome =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

/** A flight's route path, e.g. "LPPT-LSZH", read from its data file. */
function routeOf(id) {
  const file = path.join(flightsDir, `${id}.ts`)
  if (!fs.existsSync(file))
    throw new Error(`No flight "${id}" in ${flightsDir}`)
  const [origin, destination] = [
    ...fs.readFileSync(file, 'utf8').matchAll(/icao: '(\w+)'/g),
  ].map((m) => m[1])
  return `${origin}-${destination}`
}

const missing = fs
  .readdirSync(flightsDir)
  .map((f) => f.replace(/\.ts$/, ''))
  .filter((id) => id !== 'index' && !(id in positions))
if (missing.length) console.warn(`Not in positions.mjs: ${missing.join(', ')}`)

fs.mkdirSync(outDir, { recursive: true })
const browser = await puppeteer.launch({ executablePath: chrome })
const page = await browser.newPage()
await page.setViewport({ width: 1300, height: 1200, deviceScaleFactor: 2 })

for (const [id, percent] of Object.entries(positions)) {
  await page.goto(`${baseUrl}/${routeOf(id)}`, { waitUntil: 'networkidle0' })
  // The scene's frame at exactly 1024 × 768 inside its 1px border
  await page.addStyleTag({
    content: `
      main > div { width: 1026px !important; max-width: none !important }
      main > div > div:has(> .scene) { height: 770px !important; aspect-ratio: auto !important }
    `,
  })
  // Pause with the button next to the slider, then move the slider as a person would
  await page.evaluate((percent) => {
    const slider = document.querySelector('input[aria-label="Flight progress"]')
    slider.closest('div').parentElement.querySelector('button').click()
    const setValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    ).set
    setValue.call(slider, String(percent))
    slider.dispatchEvent(new Event('input', { bubbles: true }))
  }, percent)
  await new Promise((resolve) => setTimeout(resolve, 1200))

  const file = path.join(outDir, `${id}.png`)
  await (await page.$('.scene')).screenshot({ path: file })
  console.log(`${path.relative(process.cwd(), file)}  ${percent}%`)
}

await browser.close()
