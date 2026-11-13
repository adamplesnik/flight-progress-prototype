import type { Flight } from '../types'

export const mexicoCityToronto: Flight = {
  id: 'mexico-city-toronto',
  origin: {
    city: 'Mexico City',
    icao: 'MMMX',
    time: '12:25 CST',
    lat: 19.4363,
    lon: -99.0721,
  },
  destination: {
    city: 'Toronto',
    icao: 'CYYZ',
    time: '18:35 EDT',
    lat: 43.6777,
    lon: -79.6248,
  },
  // SYNTHETIC mock, not real flight data: modelled on AC990 (737 MAX, gate 12:05 → 18:55),
  // a 4h10 great-circle flight at FL370 from Mexico City's 7,316 ft elevation
  profile: [
    [0, 0, 7316, 22, 3247],
    [5, 500, 13500, 6, 3226],
    [10, 708, 23000, -18, 3176],
    [15, 791, 30500, -37, 3113],
    [20, 833, 35000, -49, 3046],
    [25, 841, 37000, -54, 2976],
    [55, 845, 37000, -54, 2554],
    [90, 840, 37000, -54, 2062],
    [120, 829, 37000, -54, 1645],
    [125, 828, 37000, -54, 1576],
    [130, 826, 37000, -55, 1507],
    [165, 820, 37000, -55, 1027],
    [200, 826, 37000, -55, 547],
    [220, 833, 37000, -55, 271],
    [225, 766, 33000, -47, 204],
    [230, 675, 26000, -32, 144],
    [235, 575, 18500, -16, 92],
    [240, 466, 11500, -2, 49],
    [245, 350, 5500, 11, 15],
    [250, 250, 569, 21, 0],
  ],
  timeline: {
    preDepartureMin: 20,
    postArrivalMin: 20,
    taxiMin: 12,
    taxiKnots: 12,
  },
}
