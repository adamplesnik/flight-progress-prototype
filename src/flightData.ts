// Flight profile sampled every 5 minutes: [speed km/h, altitude ft, temp °C, remaining km]
// Departure Dubai 03:40 GST, total flight 7h10 (430 min).
const samples: [number, number, number, number][] = [
  [0, 0, 25, 5490],
  [466, 7400, 10, 5462],
  [554, 15800, -7, 5420],
  [640, 22400, -20, 5370],
  [690, 28000, -31, 5315],
  [740, 31800, -39, 5255],
  [771, 34000, -44, 5192],
  [802, 34000, -44, 5127],
  [806, 34000, -44, 5060],
  [810, 34000, -44, 4992],
  [814, 34000, -44, 4925],
  [817, 34000, -45, 4857],
  [821, 34000, -45, 4788],
  [823, 34000, -45, 4720],
  [825, 34000, -45, 4651],
  [826, 34000, -46, 4583],
  [827, 34000, -46, 4514],
  [826, 34000, -46, 4445],
  [825, 34000, -46, 4376],
  [823, 34000, -46, 4307],
  [821, 34000, -47, 4239],
  [818, 34000, -47, 4170],
  [814, 34000, -47, 4102],
  [811, 34000, -47, 4035],
  [806, 34000, -47, 3967],
  [802, 35700, -51, 3900],
  [798, 36000, -52, 3834],
  [794, 36000, -52, 3767],
  [790, 36000, -52, 3701],
  [786, 36000, -52, 3636],
  [783, 36000, -53, 3570],
  [780, 36000, -53, 3505],
  [778, 36000, -53, 3440],
  [777, 36000, -53, 3375],
  [777, 36000, -53, 3311],
  [777, 36000, -54, 3246],
  [778, 36000, -54, 3181],
  [779, 36000, -54, 3116],
  [782, 36000, -54, 3051],
  [785, 36000, -54, 2986],
  [788, 36000, -55, 2921],
  [792, 36000, -55, 2855],
  [796, 36000, -55, 2789],
  [800, 36000, -55, 2722],
  [805, 36000, -56, 2655],
  [809, 36000, -56, 2588],
  [813, 36000, -56, 2520],
  [816, 36000, -56, 2453],
  [820, 36000, -56, 2384],
  [822, 37700, -56, 2316],
  [824, 38000, -56, 2247],
  [826, 38000, -56, 2179],
  [826, 38000, -56, 2110],
  [826, 38000, -56, 2041],
  [826, 38000, -56, 1972],
  [824, 38000, -56, 1903],
  [822, 38000, -56, 1835],
  [819, 38000, -56, 1766],
  [816, 38000, -56, 1698],
  [812, 38000, -56, 1630],
  [808, 38000, -56, 1563],
  [803, 38000, -56, 1496],
  [799, 38000, -56, 1429],
  [795, 38000, -56, 1363],
  [791, 38000, -56, 1297],
  [787, 38000, -56, 1231],
  [784, 38000, -56, 1165],
  [781, 38000, -56, 1100],
  [779, 38000, -56, 1035],
  [777, 38000, -56, 970],
  [777, 38000, -56, 906],
  [777, 38000, -56, 841],
  [777, 38000, -56, 776],
  [779, 38000, -56, 711],
  [781, 38000, -56, 646],
  [784, 38000, -56, 581],
  [787, 38000, -56, 516],
  [791, 38000, -56, 450],
  [795, 38000, -56, 384],
  [799, 38000, -56, 317],
  [761, 34000, -56, 251],
  [660, 24000, -40, 192],
  [570, 16000, -24, 141],
  [495, 11000, -14, 97],
  [429, 6600, -6, 58],
  [354, 3200, 1, 26],
  [250, 0, 7, 0],
]

export const STEP_MIN = 5
export const TOTAL_MIN = (samples.length - 1) * STEP_MIN // 430
const DEPARTURE_GST_MIN = 3 * 60 + 40

const KMH_PER_KNOT = 1.852
const MPH_PER_KNOT = 1.15078
const M_PER_FT = 0.3048
const MI_PER_KM = 0.621371

const roundTo = (value: number, step: number) => Math.round(value / step) * step
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const pad = (n: number) => String(n).padStart(2, "0")
const fmt = (n: number) => n.toLocaleString("en-US")

export type FlightReadout = {
  clock: string
  remaining: string
  kmh: string
  mph: string
  meters: string
  feet: string
  celsius: string
  fahrenheit: string
  km: string
  miles: string
}

/** progress: 0..1 across the whole flight. Values are interpolated linearly, then snapped. */
export function readoutAt(progress: number): FlightReadout {
  const minutes = Math.min(Math.max(progress, 0), 1) * TOTAL_MIN
  const i = Math.min(Math.floor(minutes / STEP_MIN), samples.length - 2)
  const t = (minutes - i * STEP_MIN) / STEP_MIN
  const [s0, a0, c0, d0] = samples[i]
  const [s1, a1, c1, d1] = samples[i + 1]

  // time: whole minutes
  const wholeMin = Math.floor(minutes)
  const clockMin = (DEPARTURE_GST_MIN + wholeMin) % 1440
  const left = TOTAL_MIN - wholeMin
  // speed: nearest 5 knots
  const knots = roundTo(lerp(s0, s1, t) / KMH_PER_KNOT, 5)
  // altitude: nearest 100 ft
  const feet = roundTo(lerp(a0, a1, t), 100)
  // distance: nearest 10 km
  const km = roundTo(lerp(d0, d1, t), 10)
  const celsius = Math.round(lerp(c0, c1, t))

  return {
    clock: `${pad(Math.floor(clockMin / 60))}:${pad(clockMin % 60)}`,
    remaining: `${Math.floor(left / 60)}:${pad(left % 60)}`,
    kmh: fmt(Math.round(knots * KMH_PER_KNOT)),
    mph: fmt(Math.round(knots * MPH_PER_KNOT)),
    meters: fmt(Math.round(feet * M_PER_FT)),
    feet: fmt(feet),
    celsius: String(celsius),
    fahrenheit: String(Math.round((celsius * 9) / 5 + 32)),
    km: fmt(km),
    miles: fmt(Math.round(km * MI_PER_KM)),
  }
}
