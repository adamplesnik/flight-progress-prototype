// The package build's entry: the library, and its stylesheet, which comes out as
// dist-lib/style.css for consumers to import themselves. Kept out of index.ts so the type
// declarations, made from index.ts, have no stylesheet import in them.
import './style.css'

export * from './index'
