import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { estimateRoute } from "@/lib/route.functions";
import type { GeoPosition } from "./useGeolocation";

/** Distance in meters between two coords (haversine). */
function metersBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Keeps an itinerary up to date while the trip is running: each time the GPS
 * origin (client or driver) moves more than `minMoveMeters`, the route is
 * recomputed so the map redraws and re-frames automatically.
 */
export function useLiveRoute(opts: {
  destination?: string | null;
  position: GeoPosition | null;
  /** Polyline used until the first live refresh arrives. */
  fallback?: string | null;
  enabled?: boolean;
  minMoveMeters?: number;
}) {
  const { destination, position, fallback = null, enabled = true, minMoveMeters = 40 } = opts;
  const estimate = useServerFn(estimateRoute);
  const [polyline, setPolyline] = useState<string | null>(fallback);
  const [info, setInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const lastOrigin = useRef<{ lat: number; lng: number } | null>(null);

  // Reset when the fallback (i.e. the trip) changes
  useEffect(() => {
    setPolyline(fallback);
    lastOrigin.current = null;
  }, [fallback]);

  useEffect(() => {
    const dest = destination?.trim();
    if (!enabled || !dest || dest.length < 2 || !position) return;
    if (lastOrigin.current && metersBetween(lastOrigin.current, position) < minMoveMeters) return;

    const origin = { lat: position.lat, lng: position.lng };
    lastOrigin.current = origin;
    let cancelled = false;
    (async () => {
      try {
        const r = await estimate({
          data: { originLat: origin.lat, originLng: origin.lng, to: dest },
        });
        if (cancelled) return;
        if (r.polyline) setPolyline(r.polyline);
        setInfo({ distanceKm: r.distanceKm, durationMin: r.durationMin });
      } catch {
        /* keep previous route */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, destination, position?.lat, position?.lng, minMoveMeters, estimate]);

  return { polyline, info };
}
