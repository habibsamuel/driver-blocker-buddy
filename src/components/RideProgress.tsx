import { useEffect, useMemo, useState } from "react";
import { RIDE_PHASES, type Ride, type RidePhase, useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Check, Car, MapPin, Flag } from "lucide-react";

function elapsedMin(iso?: string) {
  if (!iso) return 0;
  return Math.max(0, Math.round((Date.now() - +new Date(iso)) / 60000));
}

/**
 * Suivi de progression d'une course : étapes franchies, barre d'avancement
 * basée sur la distance restante (temps réel) et actions chauffeur.
 */
export function RideProgress({
  ride,
  remaining,
  canAdvance,
}: {
  ride: Ride;
  /** Info live renvoyée par useLiveRoute (distance/durée restantes). */
  remaining?: { distanceKm: number; durationMin: number } | null;
  /** Le chauffeur peut faire avancer les étapes. */
  canAdvance?: boolean;
}) {
  const { setRidePhase, completeRide } = useStore();
  const phase: RidePhase = ride.phase ?? (ride.status === "ongoing" ? "en_course" : "chauffeur_en_route");
  const index = Math.max(0, RIDE_PHASES.findIndex((p) => p.key === phase));
  const [, tick] = useState(0);

  // rafraîchit le minuteur chaque minute
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const percent = useMemo(() => {
    const stepBase = (index / (RIDE_PHASES.length - 1)) * 100;
    if (phase !== "en_course" || !remaining || !ride.distanceKm) return Math.round(stepBase);
    const done = Math.min(1, Math.max(0, 1 - remaining.distanceKm / ride.distanceKm));
    // l'étape "en course" occupe le segment entre en_course et arrive
    const segment = 100 / (RIDE_PHASES.length - 1);
    return Math.round(Math.min(100, stepBase + done * segment));
  }, [index, phase, remaining?.distanceKm, ride.distanceKm]);

  const next = RIDE_PHASES[index + 1];
  const sinceLabel = elapsedMin(ride.phaseUpdatedAt ?? ride.createdAt);

  return (
    <div className="rounded-xl border bg-muted/30 p-3 space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold flex items-center gap-1">
          {phase === "arrive" ? <Flag className="h-3.5 w-3.5 text-primary" /> : <Car className="h-3.5 w-3.5 text-primary" />}
          {RIDE_PHASES[index]?.label}
        </span>
        <span className="text-muted-foreground">
          {remaining && phase === "en_course"
            ? `${remaining.distanceKm} km · ~${remaining.durationMin} min restants`
            : `il y a ${sinceLabel} min`}
        </span>
      </div>

      {/* Barre de progression */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Étapes */}
      <ol className="grid grid-cols-5 gap-1 text-[10px]">
        {RIDE_PHASES.map((p, i) => {
          const done = i < index;
          const current = i === index;
          return (
            <li key={p.key} className="flex flex-col items-center text-center gap-1">
              <span
                className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                  done
                    ? "bg-primary border-primary text-primary-foreground"
                    : current
                      ? "border-primary text-primary animate-pulse"
                      : "border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {done ? <Check className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
              </span>
              <span className={current ? "font-semibold text-foreground" : "text-muted-foreground"}>
                {p.label}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="text-[11px] text-muted-foreground">{RIDE_PHASES[index]?.hint}</p>

      {canAdvance && next && ride.status !== "completed" && ride.status !== "cancelled" && (
        <Button
          size="sm"
          className="w-full"
          onClick={() => {
            if (next.key === "arrive") completeRide(ride.id);
            else setRidePhase(ride.id, next.key);
          }}
          disabled={next.key === "en_course"}
        >
          {next.key === "en_course" ? "En attente du code PIN client" : `Étape suivante : ${next.label}`}
        </Button>
      )}
    </div>
  );
}
