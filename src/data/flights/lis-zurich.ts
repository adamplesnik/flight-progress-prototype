import type { Flight } from '../types'

export const lisZurich: Flight = {
  id: 'lis-zurich',
  origin: {
    city: 'Lisboa',
    icao: 'LPPT',
    time: '15:45 WET',
    lat: 38.7742,
    lon: -9.1342,
  },
  destination: {
    city: 'Zürich',
    icao: 'LSZH',
    time: '19:13 CET',
    lat: 47.4581,
    lon: 8.5481,
  },
  // Traced from a tracked flight: over northern Spain, the Pyrenees and Lyon
  waypoints: [
    { lat: 40.4, lon: -6.8 },
    { lat: 42.35, lon: -2.3 },
    { lat: 44.9, lon: 4.3 },
  ],
  // SYNTHETIC mock, not real flight data: a typical climb/cruise/descent for a 2h28 flight
  profile: [
    [0, 0, 374, 17, 1720],
    [4, 430, 6000, 6, 1706],
    [8, 640, 14000, -10, 1670],
    [12, 740, 23000, -29, 1624],
    [16, 790, 30000, -44, 1573],
    [20, 810, 34000, -52, 1520],
    [24, 752, 36000, -56, 1468],
    [40, 759, 36000, -56, 1266],
    [56, 759, 36000, -56, 1063],
    [88, 745, 36000, -56, 663],
    [104, 746, 36000, -56, 464],
    [116, 752, 36000, -56, 314],
    [120, 820, 36000, -54, 262],
    [124, 760, 31000, -46, 209],
    [128, 680, 24000, -32, 161],
    [132, 600, 17000, -18, 118],
    [136, 520, 11000, -7, 81],
    [140, 450, 7000, 0, 49],
    [144, 380, 3500, 6, 21],
    [148, 250, 1416, 9, 0],
  ],
  timeline: {
    preDepartureMin: 20,
    postArrivalMin: 10,
    taxiMin: 10,
    taxiKnots: 10,
  },
}
