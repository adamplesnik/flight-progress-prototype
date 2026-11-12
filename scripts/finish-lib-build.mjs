// After the library build: fonts.css goes in as is, for the app's bundler to resolve, and
// the declarations lose the stylesheet import, which only the build itself needs
import fs from 'node:fs'

fs.copyFileSync('src/lib/fonts.css', 'dist-lib/fonts.css')
const types = 'dist-lib/types/lib/index.d.ts'
fs.writeFileSync(
  types,
  fs.readFileSync(types, 'utf8').replace(/^import '\.\/style\.css';\n/m, '')
)
