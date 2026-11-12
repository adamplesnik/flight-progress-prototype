/**
 * Captures the map of each flight in positions.mjs at 1024 × 768, 2× (2048 × 1536 px),
 * into screens/images/<flight id>.png, from the dev server's /capture page.
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
const outDir = path.join(here, 'images')
const baseUrl = `http://localhost:${process.env.PORT ?? 8443}`
const chrome =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

fs.mkdirSync(outDir, { recursive: true })
const browser = await puppeteer.launch({ executablePath: chrome })
const page = await browser.newPage()
await page.setViewport({ width: 1100, height: 850, deviceScaleFactor: 2 })

for (const [id, percent] of Object.entries(positions)) {
  const query = new URLSearchParams({ flight: id, progress: percent / 100 })
  await page.goto(`${baseUrl}/capture?${query}`)
  // The map is in once it has paths, the font once the document's fonts are ready
  await page.waitForSelector('.world-map path, [data-missing]')
  if (await page.$('[data-missing]')) {
    console.warn(`No flight "${id}": skipped`)
    continue
  }
  await page.evaluate(() => document.fonts.ready)

  const file = path.join(outDir, `${id}.png`)
  await (await page.$('.scene')).screenshot({ path: file })
  console.log(`${path.relative(process.cwd(), file)}  ${percent}%`)
}

await browser.close()
