import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router'
import App from './App'
import { defaultFlight, findFlight, flightPath } from './data/flights'
import './index.css'

/** /ORIG-DEST shows that flight; anything else goes to the default one. */
function FlightRoute() {
  const { route = '' } = useParams()
  const flight = findFlight(route)
  if (!flight) return <Navigate to={flightPath(defaultFlight)} replace />
  // Lower-case codes work too, but the address bar shows them in capitals
  if (`/${route}` !== flightPath(flight))
    return <Navigate to={flightPath(flight)} replace />
  return <App flight={flight} />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/:route" element={<FlightRoute />} />
        <Route path="*" element={<Navigate to={flightPath(defaultFlight)} replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
