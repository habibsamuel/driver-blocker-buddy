import { useEffect, useRef, useState } from "react";
import type { GeoPosition } from "@/hooks/useGeolocation";

const YAOUNDE = { lat: 4.0511, lng: 9.7679 };
const routeCoordinates: [number, number][] = [
  [9.7044, 4.0469], [9.7118, 4.0494], [9.7199, 4.0525], [9.7277, 4.0578], [9.7357, 4.0642],
];
const nearbyTaxis = [
  { lat: 4.0557, lng: 9.7625, angle: -18 },
  { lat: 4.048, lng: 9.7728, angle: 36 },
  { lat: 4.0438, lng: 9.7642, angle: 82 },
];

export type MapMode = "search" | "vehicle" | "trip";

export function TaxiMap({ position, recenterSignal, mode }: { position: GeoPosition | null; recenterSignal: number; mode: MapMode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
  const userMarkerRef = useRef<import("mapbox-gl").Marker | null>(null);
  const routeTaxiRef = useRef<import("mapbox-gl").Marker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const modeRef = useRef(mode);

  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    let cancelled = false;
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token) {
      setError("Carte de démonstration");
      return;
    }

    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled || !containerRef.current) return;
      mapboxgl.accessToken = token;
      const map = new mapboxgl.Map({ container: containerRef.current, style: "mapbox://styles/mapbox/streets-v12", center: [YAOUNDE.lng, YAOUNDE.lat], zoom: 13.5, attributionControl: false });
      map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
      mapRef.current = map;

      nearbyTaxis.forEach((taxi, index) => {
        const marker = document.createElement("div");
        marker.className = "taxi-proxi-map-car";
        marker.style.setProperty("--taxi-angle", `${taxi.angle}deg`);
        marker.style.setProperty("--taxi-delay", `${index * 300}ms`);
        marker.innerHTML = "<span>🚕</span>";
        new mapboxgl.Marker({ element: marker, anchor: "center" }).setLngLat([taxi.lng, taxi.lat]).addTo(map);
      });

      map.on("load", () => {
        map.addSource("taxi-route", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: routeCoordinates } } });
        map.addLayer({ id: "taxi-route-halo", type: "line", source: "taxi-route", paint: { "line-color": "#10B981", "line-width": 11, "line-opacity": 0 } });
        map.addLayer({ id: "taxi-route-line", type: "line", source: "taxi-route", paint: { "line-color": "#10B981", "line-width": 5, "line-opacity": 0 } });
        const taxi = document.createElement("div");
        taxi.className = "taxi-proxi-route-car";
        taxi.innerHTML = "🚕";
        routeTaxiRef.current = new mapboxgl.Marker({ element: taxi, anchor: "center" }).setLngLat(routeCoordinates[3]).addTo(map);
        updateMode(map, modeRef.current);
      });
    }).catch(() => setError("Carte de démonstration"));

    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map?.loaded()) updateMode(map, mode);
    if (routeTaxiRef.current) routeTaxiRef.current.getElement().style.opacity = mode === "trip" ? "1" : "0";
  }, [mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !position) return;
    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (!mapRef.current) return;
      if (!userMarkerRef.current) {
        const marker = document.createElement("div");
        marker.className = "taxi-proxi-user-marker";
        marker.innerHTML = "<span></span>";
        userMarkerRef.current = new mapboxgl.Marker({ element: marker }).setLngLat([position.lng, position.lat]).addTo(mapRef.current);
      } else userMarkerRef.current.setLngLat([position.lng, position.lat]);
    });
  }, [position?.lat, position?.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const center: [number, number] = position ? [position.lng, position.lat] : [YAOUNDE.lng, YAOUNDE.lat];
    map.flyTo({ center, zoom: 15, duration: 300, essential: true });
  }, [recenterSignal]);

  return (
    <div className="absolute inset-0 bg-map-canvas">
      <div ref={containerRef} className="h-full w-full" aria-label="Carte de Yaoundé" />
      {error && <DemoMap />}
    </div>
  );
}

function updateMode(map: import("mapbox-gl").Map, mode: MapMode) {
  const visible = mode === "search" ? 0 : 1;
  map.setPaintProperty("taxi-route-halo", "line-opacity", mode === "trip" ? 0.18 : visible * 0.1);
  map.setPaintProperty("taxi-route-line", "line-opacity", visible);
  if (mode !== "search") map.fitBounds([[9.698, 4.04], [9.742, 4.071]], { padding: { top: 140, bottom: 370, left: 40, right: 40 }, duration: 300 });
}

function DemoMap() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-map-canvas" aria-label="Aperçu de la carte de Yaoundé">
      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(28deg,transparent_47%,var(--map-road)_48%,var(--map-road)_51%,transparent_52%),linear-gradient(118deg,transparent_46%,var(--surface)_47%,var(--surface)_51%,transparent_52%)] [background-size:110px_90px,150px_130px]" />
      <span className="absolute left-[18%] top-[22%] text-xs font-bold text-muted-foreground">Bastos</span><span className="absolute right-[15%] top-[30%] text-xs font-bold text-muted-foreground">Omnisports</span><span className="absolute left-[37%] top-[43%] text-xs font-bold text-muted-foreground">Poste Centrale</span><span className="absolute bottom-[35%] right-[24%] text-xs font-bold text-muted-foreground">Carrefour Warda</span>
      <span className="absolute left-[23%] top-[34%] text-3xl drop-shadow-md">🚕</span><span className="absolute right-[25%] top-[48%] text-3xl drop-shadow-md">🚕</span><span className="absolute left-[55%] top-[20%] text-3xl drop-shadow-md">🚕</span>
      <span className="absolute bottom-2 right-2 rounded-full bg-surface/90 px-2 py-1 text-[9px] font-bold text-muted-foreground">{errorLabel()}</span>
    </div>
  );
}

function errorLabel() { return "Aperçu carte"; }