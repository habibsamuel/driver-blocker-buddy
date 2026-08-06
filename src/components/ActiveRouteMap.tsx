import { MapView } from "@/components/MapView";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useDriverPositions } from "@/hooks/useDriverPositions";
import { useLiveRoute } from "@/hooks/useLiveRoute";

/**
 * Carte d'une course en cours : l'itinéraire vert est recalculé et recadré
 * automatiquement dès que la position GPS (client ou chauffeur) change.
 */
export function ActiveRouteMap({
  destination,
  fallbackPolyline,
  className = "h-56",
}: {
  destination: string;
  fallbackPolyline?: string | null;
  className?: string;
}) {
  const liveDrivers = useDriverPositions();
  const { position } = useGeolocation(true);
  const { polyline, info } = useLiveRoute({
    destination,
    position,
    fallback: fallbackPolyline ?? null,
  });

  return (
    <div className="space-y-1">
      <MapView
        drivers={liveDrivers}
        me={position ? { lat: position.lat, lng: position.lng } : null}
        routePolyline={polyline}
        className={className}
      />
      <p className="text-[11px] text-muted-foreground">
        Itinéraire en direct (tracé en vert) — mis à jour et recadré à chaque déplacement
        {info ? ` · ${info.distanceKm} km · ${info.durationMin} min restants` : ""}
      </p>
    </div>
  );
}
