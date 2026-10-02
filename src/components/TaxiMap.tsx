import { useEffect, useRef, useState } from "react";
import type { GeoPosition } from "@/hooks/useGeolocation";

const YAOUNDE = { lat: 4.0511, lng: 9.7679 };

const nearbyTaxis = [
  { lat: 4.0557, lng: 9.7625, angle: -18 },
  { lat: 4.048, lng: 9.7728, angle: 36 },
  { lat: 4.0438, lng: 9.7642, angle: 82 },
];

export function TaxiMap({ position, recenterSignal }: { position: GeoPosition | null; recenterSignal: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
  const userMarkerRef = useRef<import("mapbox-gl").Marker | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token) {
      setError("Ajoutez VITE_MAPBOX_TOKEN pour afficher la carte Mapbox.");
      return;
    }

    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled || !containerRef.current) return;
      mapboxgl.accessToken = token;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [YAOUNDE.lng, YAOUNDE.lat],
        zoom: 13.5,
        attributionControl: false,
      });
      map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
      mapRef.current = map;

      nearbyTaxis.forEach((taxi, index) => {
        const marker = document.createElement("div");
        marker.className = "taxi-proxi-map-car";
        marker.style.setProperty("--taxi-angle", `${taxi.angle}deg`);
        marker.style.setProperty("--taxi-delay", `${index * 280}ms`);
        marker.setAttribute("aria-label", "Taxi disponible");
        marker.innerHTML = "<span>🚕</span>";
        new mapboxgl.Marker({ element: marker, anchor: "center" })
          .setLngLat([taxi.lng, taxi.lat])
          .addTo(map);
      });
    }).catch(() => setError("La carte Mapbox n’a pas pu être chargée."));

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !position) return;
    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (!mapRef.current) return;
      if (!userMarkerRef.current) {
        const marker = document.createElement("div");
        marker.className = "taxi-proxi-user-marker";
        marker.innerHTML = "<span></span>";
        userMarkerRef.current = new mapboxgl.Marker({ element: marker })
          .setLngLat([position.lng, position.lat])
          .addTo(mapRef.current);
      } else {
        userMarkerRef.current.setLngLat([position.lng, position.lat]);
      }
    });
  }, [position?.lat, position?.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const center = position ? [position.lng, position.lat] as [number, number] : [YAOUNDE.lng, YAOUNDE.lat] as [number, number];
    map.flyTo({ center, zoom: 15, duration: 900, essential: true });
  }, [recenterSignal]);

  return (
    <div className="absolute inset-0 bg-map-canvas">
      <div ref={containerRef} className="h-full w-full" aria-label="Carte de Yaoundé" />
      {error && (
        <div className="absolute inset-0 grid place-items-center bg-map-canvas px-8 text-center">
          <div className="max-w-xs rounded-2xl border border-map-road bg-surface/95 p-5 shadow-2xl">
            <div className="mb-3 text-4xl">🗺️</div>
            <p className="text-sm font-bold text-foreground">Carte temporairement indisponible</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
