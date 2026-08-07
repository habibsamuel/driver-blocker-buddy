import { useEffect, useRef, useState } from "react";
import type { LiveDriver } from "@/hooks/useDriverPositions";

// Yaoundé center
const YAOUNDE = { lat: 3.848, lng: 11.5021 };

declare global {
  interface Window {
    google?: any;
    __initTaxiMap?: () => void;
  }
}

let scriptLoading: Promise<void> | null = null;

function loadMapsScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (scriptLoading) return scriptLoading;

  scriptLoading = new Promise((resolve, reject) => {
    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    if (!key) {
      reject(new Error("Missing Google Maps key"));
      return;
    }
    window.__initTaxiMap = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__initTaxiMap${channel ? `&channel=${channel}` : ""}`;
    s.async = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return scriptLoading;
}

const DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a2a" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3a3a3a" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#FFCC00" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a0a0a" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#222" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#333" }] },
];

/** Carte claire, colorée et très lisible : quartiers, axes, POI et noms de rues visibles. */
const VIVID_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f4f2ec" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#3f3d33" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 3 }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#eae6da" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#8a6d1f" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#bfe3b4" }] },
  { featureType: "poi.business", elementType: "geometry", stylers: [{ color: "#f6e2b8" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#ffe9a8" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ffcc00" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#e0a800" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#d7cdb5" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#9fd3e8" }] },
  { featureType: "administrative.neighborhood", elementType: "labels.text.fill", stylers: [{ color: "#6b6455" }] },
];


/** Google encoded-polyline decoder (no extra library needed). */
function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let result = 0, shift = 0, b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0; shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

export function MapView({
  drivers,
  me,
  routePolyline,
  className,
}: {
  drivers: LiveDriver[];
  me?: { lat: number; lng: number } | null;
  /** Encoded polyline of the active trip: drawn in green and framed automatically. */
  routePolyline?: string | null;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const meMarkerRef = useRef<any>(null);
  const routeRef = useRef<any>(null);
  const routeMarkersRef = useRef<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadMapsScript()
      .then(() => {
        if (cancelled || !ref.current) return;
        mapRef.current = new window.google.maps.Map(ref.current, {
          center: me ?? YAOUNDE,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          styles: DARK_STYLE,
        });
        setReady(true);
      })
      .catch((e) => setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  // Recenter on me when first available (skip while a trip route is framed)
  useEffect(() => {
    if (!ready || !mapRef.current || !me || routePolyline) return;
    if (!meMarkerRef.current) mapRef.current.panTo(me);
  }, [ready, me?.lat, me?.lng, routePolyline]);

  // Active trip route: green polyline + auto framing
  useEffect(() => {
    if (!ready || !mapRef.current || !window.google) return;
    routeRef.current?.setMap(null);
    routeRef.current = null;
    routeMarkersRef.current.forEach((m) => m.setMap(null));
    routeMarkersRef.current = [];
    if (!routePolyline) return;

    const path = decodePolyline(routePolyline);
    if (path.length < 2) return;

    routeRef.current = new window.google.maps.Polyline({
      path,
      map: mapRef.current,
      strokeColor: "#22c55e",
      strokeOpacity: 0.95,
      strokeWeight: 7,
      geodesic: true,
      zIndex: 5,
    });

    const endpoints: [{ lat: number; lng: number }, string, string][] = [
      [path[0], "Départ", "#22c55e"],
      [path[path.length - 1], "Destination", "#ef4444"],
    ];
    endpoints.forEach(([position, title, color]) => {
      routeMarkersRef.current.push(
        new window.google.maps.Marker({
          position,
          map: mapRef.current,
          title,
          zIndex: 6,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          },
        }),
      );
    });

    const bounds = new window.google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    mapRef.current.fitBounds(bounds, { top: 48, right: 32, bottom: 32, left: 32 });
  }, [routePolyline, ready]);

  // Driver markers
  useEffect(() => {
    if (!ready || !mapRef.current || !window.google) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    drivers.forEach((d) => {
      const marker = new window.google.maps.Marker({
        position: { lat: d.lat, lng: d.lng },
        map: mapRef.current,
        title: d.name ?? "Chauffeur",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#FFCC00",
          fillOpacity: 1,
          strokeColor: "#000",
          strokeWeight: 2,
        },
        label: { text: "🚖", fontSize: "14px" },
      });
      markersRef.current.push(marker);
    });
  }, [drivers, ready]);

  // Me marker
  useEffect(() => {
    if (!ready || !mapRef.current || !window.google) return;
    if (!me) {
      meMarkerRef.current?.setMap(null);
      meMarkerRef.current = null;
      return;
    }
    if (!meMarkerRef.current) {
      meMarkerRef.current = new window.google.maps.Marker({
        position: me,
        map: mapRef.current,
        title: "Ma position",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 3,
        },
      });
    } else {
      meMarkerRef.current.setPosition(me);
    }
  }, [me?.lat, me?.lng, ready]);

  if (error) {
    return (
      <div className={className}>
        <div className="h-full w-full flex items-center justify-center bg-zinc-900 text-zinc-400 text-sm rounded-2xl">
          Carte indisponible: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={ref} className="h-full w-full rounded-2xl overflow-hidden" />
    </div>
  );
}
