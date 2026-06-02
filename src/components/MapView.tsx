import { useEffect, useRef, useState } from "react";

// Yaoundé center
const YAOUNDE = { lat: 3.848, lng: 11.5021 };

// Pseudo-random spread around city for driver positions (deterministic by id)
function hashSpread(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const dx = ((h % 1000) / 1000 - 0.5) * 0.08;
  const dy = (((h >> 10) % 1000) / 1000 - 0.5) * 0.08;
  return { lat: YAOUNDE.lat + dy, lng: YAOUNDE.lng + dx };
}

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

// Dark Yango-like map style
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

export type DriverPin = {
  id: string;
  name: string;
  blocked: boolean;
  active: boolean;
};

export function MapView({ drivers, className }: { drivers: DriverPin[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadMapsScript()
      .then(() => {
        if (cancelled || !ref.current) return;
        mapRef.current = new window.google.maps.Map(ref.current, {
          center: YAOUNDE,
          zoom: 13,
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

  useEffect(() => {
    if (!ready || !mapRef.current || !window.google) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    drivers.forEach((d) => {
      const pos = hashSpread(d.id);
      const color = d.blocked ? "#ef4444" : d.active ? "#FFCC00" : "#6b7280";
      const marker = new window.google.maps.Marker({
        position: pos,
        map: mapRef.current,
        title: d.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#000",
          strokeWeight: 2,
        },
        label: { text: "🚖", fontSize: "14px" },
      });
      markersRef.current.push(marker);
    });
  }, [drivers, ready]);

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
