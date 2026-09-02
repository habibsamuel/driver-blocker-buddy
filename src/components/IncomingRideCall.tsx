import { useEffect, useState } from "react";
import { Phone, PhoneOff, MapPin, Navigation } from "lucide-react";
import type { RingingOffer } from "@/hooks/useDriverOffers";

/**
 * Écran d'appel entrant plein écran (style WhatsApp/FaceTime) affiché au
 * chauffeur quand une course sonne. Refus automatique à l'expiration (45 s).
 */
export function IncomingRideCall({
  offer,
  onAccept,
  onDecline,
  busy,
}: {
  offer: RingingOffer;
  onAccept: () => void;
  onDecline: () => void;
  busy?: boolean;
}) {
  const [left, setLeft] = useState(() =>
    Math.max(0, Math.round((new Date(offer.expiresAt).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    const id = setInterval(() => {
      const s = Math.max(0, Math.round((new Date(offer.expiresAt).getTime() - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) onDecline();
    }, 1000);
    return () => clearInterval(id);
  }, [offer.expiresAt, onDecline]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-between bg-foreground/95 px-6 py-10 text-background">
      <div className="text-center space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] opacity-70">Nouvelle course</p>
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary text-4xl">
          🚖
        </div>
        <p className="text-2xl font-bold">{offer.clientName}</p>
        <p className="text-sm opacity-80 flex items-center justify-center gap-1">
          <MapPin className="h-4 w-4" /> à {offer.distanceKm} km de vous
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3 rounded-3xl bg-background/10 p-5 backdrop-blur">
        <p className="flex items-start gap-2 text-base font-semibold">
          <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {offer.destination}
        </p>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-xl bg-background/10 py-2">
            <p className="text-[10px] uppercase opacity-70">Distance</p>
            <p className="font-bold">{offer.tripDistanceKm} km</p>
          </div>
          <div className="rounded-xl bg-background/10 py-2">
            <p className="text-[10px] uppercase opacity-70">Durée</p>
            <p className="font-bold">{offer.durationMin} min</p>
          </div>
          <div className="rounded-xl bg-primary py-2 text-foreground">
            <p className="text-[10px] uppercase opacity-70">Course</p>
            <p className="font-bold">{offer.fare} F</p>
          </div>
        </div>
        <p className="text-center text-xs opacity-80">Refus automatique dans {left} s</p>
      </div>

      <div className="flex w-full max-w-sm items-center justify-around">
        <button
          type="button"
          onClick={onDecline}
          disabled={busy}
          aria-label="Refuser la course"
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-full bg-destructive text-destructive-foreground shadow-2xl active:scale-95 disabled:opacity-60"
        >
          <PhoneOff className="h-9 w-9" />
          <span className="text-xs font-bold">REFUSER</span>
        </button>
        <button
          type="button"
          onClick={onAccept}
          disabled={busy}
          aria-label="Accepter la course"
          className="flex h-28 w-28 animate-pulse flex-col items-center justify-center gap-1 rounded-full bg-green-600 text-white shadow-2xl active:scale-95 disabled:opacity-60"
        >
          <Phone className="h-10 w-10" />
          <span className="text-xs font-bold">ACCEPTER</span>
        </button>
      </div>
    </div>
  );
}
