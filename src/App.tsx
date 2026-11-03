import { useCallback, useEffect, useRef, useState } from "react";
import { countryLabels } from "./countryLabels";
import { readoutAt, type FlightReadout } from "./flightData";

const assetPath = "/assets";
const routeGeometry =
  "M596.4 359.9 C588.2 363.2 569 366.4 543.9 359.8 C513.4 351.8 439.4 311.8 383.4 277.3 C365 266 338 245 312.2 225 C264.3 186.6 215.6 149 166.3 112.2 C116.5 76.1 66.6 40.2 -11.6 -4.1";
// Set to false to hide country names on the map
const showCountryNames = false;
const flightDuration = 18000;
const initialFlightProgress = 0.5;

type CityClusterProps = {
  city: string;
  time: string;
  className: string;
};

function CityCluster({ city, time, className }: CityClusterProps) {
  return (
    <section className={`city-cluster ${className}`}>
      <div className="city-copy">
        <h1>{city}</h1>
        <p>{time}</p>
      </div>
      <span className="route-dot" aria-hidden="true" />
    </section>
  );
}

function FlightData({ data }: { data: FlightReadout }) {
  return (
    <dl className="flight-data" aria-label="Current flight conditions">
      <div>
        <dt>
          {data.kmh} <span>km/h</span>
        </dt>
        <dd>
          {data.mph} <span>mph</span>
        </dd>
      </div>
      <div>
        <dt>
          {data.meters} <span>m</span>
        </dt>
        <dd>
          {data.feet} <span>ft</span>
        </dd>
      </div>
      <div>
        <dt>
          {data.celsius} <span>°C</span>
        </dt>
        <dd>
          {data.fahrenheit} <span>°F</span>
        </dd>
      </div>
    </dl>
  );
}

function CountryNames() {
  return (
    <svg
      className="world-map country-names"
      viewBox="0 0 4003.05 1721.37"
      aria-hidden="true"
    >
      {countryLabels.map(({ id, name, x, y }) => (
        <text key={id} x={x} y={y}>
          {name}
        </text>
      ))}
    </svg>
  );
}

function AnimatedRoute({
  data,
  onReadout,
}: {
  data: FlightReadout;
  onReadout: (data: FlightReadout) => void;
}) {
  const routeRef = useRef<SVGPathElement>(null);
  const flownRef = useRef<SVGPathElement>(null);
  const markerRef = useRef<SVGGElement>(null);
  const pausedRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);

  const toggleFlight = () => {
    pausedRef.current = !pausedRef.current;
    setIsPaused(pausedRef.current);
  };

  const handleMarkerKeyDown = (
    event: React.KeyboardEvent<SVGCircleElement>,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleFlight();
    }
  };

  useEffect(() => {
    const route = routeRef.current;
    const flown = flownRef.current;
    const marker = markerRef.current;

    if (!route || !flown || !marker) return;

    const routeLength = route.getTotalLength();
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let frame = 0;
    let previousTime: number | undefined;
    let progress = initialFlightProgress;

    const renderProgress = (progress: number) => {
      const point = route.getPointAtLength(routeLength * progress);
      flown.setAttribute("stroke-dasharray", `${progress} 1`);
      marker.setAttribute("transform", `translate(${point.x} ${point.y})`);
      onReadout(readoutAt(progress));
    };

    if (reducedMotion) {
      renderProgress(initialFlightProgress);
      return;
    }

    const animate = (time: number) => {
      previousTime ??= time;

      if (!pausedRef.current) {
        progress = (progress + (time - previousTime) / flightDuration) % 1;
        renderProgress(progress);
      }

      previousTime = time;
      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [onReadout]);

  return (
    <>
      <svg
        className="route-path route-lines"
        viewBox="0 0 598.472 383.641"
        fill="none"
        aria-hidden="true"
      >
        <path
          ref={routeRef}
          className="route-segment route-remaining"
          d={routeGeometry}
        />
        <path
          ref={flownRef}
          className="route-segment route-flown"
          d={routeGeometry}
          pathLength="1"
          strokeDasharray="0 1"
        />
      </svg>
      <svg
        className="route-path marker-layer"
        viewBox="0 0 598.472 383.641"
        fill="none"
        overflow="visible"
        aria-hidden="true"
      >
        <g ref={markerRef} className="flight-marker">
          <foreignObject x="-150" y="40" width="174" height="150">
            <div className="marker-data">
              <p className="time-left">
                <span>in</span> {data.remaining}
              </p>
              <p className="distance-primary">{data.km} km</p>
              <p className="distance-secondary">{data.miles} mi</p>
            </div>
          </foreignObject>
          <circle
            r="18"
            role="button"
            tabIndex={0}
            aria-label={
              isPaused ? "Resume flight animation" : "Pause flight animation"
            }
            aria-pressed={isPaused}
            onClick={toggleFlight}
            onKeyDown={handleMarkerKeyDown}
          />
        </g>
      </svg>
    </>
  );
}

function App() {
  const [data, setData] = useState(() => readoutAt(initialFlightProgress));
  const onReadout = useCallback((next: FlightReadout) => {
    setData((prev) =>
      (Object.keys(next) as (keyof FlightReadout)[]).every(
        (k) => prev[k] === next[k],
      )
        ? prev
        : next,
    );
  }, []);

  return (
    <main className="flight-map">
      <div className="scene">
        <img
          className="world-map"
          src={`${assetPath}/150bf.svg`}
          alt=""
          aria-hidden="true"
        />

        {showCountryNames && <CountryNames />}

        <AnimatedRoute data={data} onReadout={onReadout} />

        <CityCluster
          city="London"
          time="→ 06:50 GMT"
          className="london-cluster"
        />

        <CityCluster
          city="Dubai"
          time="03:40 GST →"
          className="dubai-cluster"
        />

        <FlightData data={data} />

        <time className="local-time" dateTime={data.clock}>
          {data.clock}
        </time>
      </div>
    </main>
  );
}

export default App;
