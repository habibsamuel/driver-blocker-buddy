import { useEffect, useState } from "react";

export type GeoPosition = { lat: number; lng: number; heading: number | null; accuracy: number };

export function useGeolocation(enabled: boolean) {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !navigator.geolocation) {
      setError(enabled ? "Géolocalisation non disponible" : null);
      return;
    }
    setError(null);
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setPosition({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          heading: p.coords.heading,
          accuracy: p.coords.accuracy,
        });
      },
      (e) => setError(e.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled]);

  return { position, error };
}
