import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronUp,
  Clock3,
  LocateFixed,
  MessageCircle,
  Navigation,
  Phone,
  Share2,
  Star,
  X,
} from "lucide-react";
import { MapView } from "@/components/MapView";
import { FluentEmoji } from "@/components/FluentEmoji";
import { RideProgress } from "@/components/RideProgress";
import { Button } from "@/components/ui/button";
import type { LiveDriver } from "@/hooks/useDriverPositions";
import type { GeoPosition } from "@/hooks/useGeolocation";
import type { Ride, RidePhase } from "@/lib/store";
import { toast } from "sonner";

type ConfirmedRide = {
  rideId: string;
  startPin: string;
  driverName: string;
  driverPhone: string;
  plate?: string;
  vehicle?: string;
  rating?: number;
  total: number;
  routePolyline?: string | null;
};

const formatPhone = (phone: string) => phone.startsWith("+") ? phone : `+237 ${phone.replace(/\D/g, "")}`;

export function RideExperience({
  confirmed,
  ride,
  destination,
  position,
  drivers,
  routePolyline,
  remaining,
  etaMin,
  requestId,
  searchingDrivers,
  onReset,
  onCancel,
}: {
  confirmed: ConfirmedRide;
  ride?: Ride;
  destination: string;
  position: GeoPosition | null;
  drivers: LiveDriver[];
  routePolyline?: string | null;
  remaining?: { distanceKm: number; durationMin: number } | null;
  etaMin: number | null;
  requestId: string | null;
  searchingDrivers: number;
  onReset: () => void;
  onCancel: () => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const phase: RidePhase = ride?.phase ?? "chauffeur_en_route";
  const completed = ride?.status === "completed" || phase === "arrive";
  const onTrip = phase === "en_course";
  const arrived = phase === "chauffeur_arrive";
  const rating = confirmed.rating && confirmed.rating > 0 ? confirmed.rating.toFixed(1) : "4.8";
  const pickupTime = useMemo(() => new Date(ride?.startedAt ?? ride?.createdAt ?? Date.now()).toLocaleTimeString("fr-CM", { hour: "2-digit", minute: "2-digit" }), [ride?.startedAt, ride?.createdAt]);
  const arrivalTime = useMemo(() => new Date(Date.now() + (remaining?.durationMin ?? etaMin ?? 5) * 60000).toLocaleTimeString("fr-CM", { hour: "2-digit", minute: "2-digit" }), [remaining?.durationMin, etaMin]);
  const progress = ride?.distanceKm && remaining ? Math.max(0, ride.distanceKm - remaining.distanceKm) : 0;

  const shareRide = async () => {
    const text = `Je suis en course avec TAXI PROXI vers ${destination}. Chauffeur : ${confirmed.driverName}, plaque ${confirmed.plate ?? "à confirmer"}.`;
    if (navigator.share) await navigator.share({ title: "Ma course TAXI PROXI", text });
    else {
      await navigator.clipboard?.writeText(text);
      toast.success("Informations de course copiées");
    }
  };

  if (completed) {
    return (
      <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-background px-5 py-10">
        <section className="w-full max-w-md animate-glass-condense space-y-6 text-center">
          <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-primary/12 ring-1 ring-primary/30">
            <FluentEmoji name="check" className="h-24 w-24 animate-taxi-breathe" alt="Course terminée" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-primary">Arrivée à destination</p>
            <h1 className="mt-2 text-3xl font-black">Course terminée !</h1>
            <p className="mt-2 text-sm text-muted-foreground">Merci d’avoir voyagé avec un taxi conventionnel de Yaoundé.</p>
          </div>
          <div className="liquid-glass rounded-3xl p-5 text-left">
            <div className="flex items-center gap-3 border-b border-glass-border pb-4">
              <FluentEmoji name="taxi" className="h-14 w-14" />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{confirmed.driverName}</p>
                <p className="text-xs text-muted-foreground">{confirmed.vehicle ?? "Taxi jaune"} · {confirmed.plate ?? "CE 1234 A"}</p>
              </div>
              <span className="font-black text-primary">{confirmed.total.toLocaleString("fr-FR")} FCFA</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Info label="Départ" value={pickupTime} />
              <Info label="Arrivée" value={new Date().toLocaleTimeString("fr-CM", { hour: "2-digit", minute: "2-digit" })} />
              <Info label="Destination" value={destination} />
              <Info label="Paiement" value="Espèces" />
            </div>
          </div>
          <div className="rounded-2xl border border-primary/25 bg-primary/8 p-4 text-left">
            <div className="flex items-center gap-3"><FluentEmoji name="star" className="h-11 w-11" /><div><p className="font-bold">Proxi Rewards</p><p className="text-xs text-muted-foreground">Gagnez des points à chaque course terminée.</p></div></div>
          </div>
          <Button className="h-14 w-full rounded-2xl text-base font-black" onClick={onReset}>Retour à l’accueil</Button>
        </section>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 overflow-hidden bg-background">
      <MapView drivers={drivers} me={position ? { lat: position.lat, lng: position.lng } : null} routePolyline={routePolyline} className="absolute inset-0 h-full w-full" theme="standard" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-map-fade" />
      <div className="liquid-glass absolute left-4 right-4 top-[max(1rem,env(safe-area-inset-top))] flex items-center gap-3 rounded-2xl px-4 py-3 animate-glass-condense md:left-1/2 md:max-w-md md:-translate-x-1/2">
        <FluentEmoji name={onTrip ? "taxi" : "oncoming-taxi"} className="h-12 w-12 shrink-0 animate-taxi-breathe" />
        <div className="min-w-0 flex-1">
          <p className="font-black leading-tight">{onTrip ? `${remaining?.durationMin ?? ride?.durationMin ?? "—"} min restantes` : arrived ? "Votre chauffeur est arrivé" : requestId ? "Recherche de votre taxi…" : `Chauffeur à ${etaMin ?? "—"} min`}</p>
          <p className="truncate text-xs text-muted-foreground">{onTrip ? `${remaining?.distanceKm ?? ride?.distanceKm ?? "—"} km · ${destination}` : requestId && searchingDrivers ? `${searchingDrivers} taxis vérifiés contactés` : `Vers ${destination}`}</p>
        </div>
        <div className="rounded-xl bg-primary px-3 py-2 text-center text-primary-foreground"><p className="text-[9px] font-bold uppercase">PIN</p><p className="font-black">{confirmed.startPin}</p></div>
      </div>

      <section className={`absolute inset-x-0 bottom-0 transition-all duration-500 ${expanded || detailsOpen ? "top-[18dvh]" : "top-auto"}`}>
        <div className="mx-auto max-w-lg rounded-t-[28px] border-t border-glass-border bg-card/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-2xl">
          <button type="button" className="mx-auto mb-3 block" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? "Réduire les détails" : "Afficher le suivi détaillé"}>
            <span className="block h-1.5 w-12 rounded-full bg-muted-foreground/35" />
          </button>

          {detailsOpen ? (
            <DriverDetails confirmed={confirmed} rating={rating} onClose={() => setDetailsOpen(false)} />
          ) : (
            <div className="space-y-4">
              {ride && <RideProgress ride={ride} remaining={remaining} />}
              <button type="button" onClick={() => setDetailsOpen(true)} className="flex w-full items-center gap-3 rounded-2xl border border-glass-border bg-secondary/70 p-3 text-left">
                <div className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/12"><FluentEmoji name="oncoming-taxi" className="h-12 w-12" /><span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-success" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><p className="truncate font-black">{confirmed.driverName}</p><span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-black text-primary-foreground">VÉRIFIÉ CUY</span></div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Star className="h-3.5 w-3.5 fill-primary text-primary" /> {rating} · {confirmed.vehicle ?? "Taxi jaune"}</p>
                </div>
                <div className="rounded-xl border border-primary/25 bg-background px-3 py-2 text-right"><p className="text-[9px] uppercase text-muted-foreground">CM</p><p className="font-mono text-xs font-black text-primary">{confirmed.plate ?? "CE 1234 A"}</p></div>
              </button>

              {(onTrip || expanded) && (
                <div className="grid grid-cols-3 gap-2 animate-glass-condense">
                  <Metric label="Prise en charge" value={pickupTime} />
                  <Metric label="Arrivée estimée" value={arrivalTime} />
                  <Metric label={onTrip ? "Parcouru" : "Distance"} value={`${(onTrip ? progress : ride?.distanceKm ?? 0).toFixed(1)} km`} />
                </div>
              )}

              <div className="flex items-end justify-between">
                <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Tarif estimé</p><p className="text-2xl font-black text-primary">{confirmed.total.toLocaleString("fr-FR")} FCFA</p><p className="text-[10px] text-muted-foreground">Paiement en espèces au chauffeur</p></div>
                <button type="button" onClick={() => setExpanded((value) => !value)} className="flex items-center gap-1 text-xs font-bold text-primary">{expanded ? <>Réduire <ChevronDown className="h-4 w-4" /></> : <>Suivi détaillé <ChevronUp className="h-4 w-4" /></>}</button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <Action href={`tel:${confirmed.driverPhone}`} icon={Phone} label="Appeler" />
                <Action href={`sms:${confirmed.driverPhone}`} icon={MessageCircle} label="Chat" />
                <Action onClick={() => void shareRide()} icon={Share2} label="Partager" />
                <Action onClick={() => toast.success("Position en direct activée")} icon={LocateFixed} label="Position" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="h-12 flex-1 rounded-xl" onClick={onCancel}><X className="h-4 w-4" /> Annuler</Button>
                <Button className="h-12 flex-[1.7] rounded-xl font-black" onClick={() => setExpanded((value) => !value)}><Navigation className="h-4 w-4" /> Voir sur la carte</Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DriverDetails({ confirmed, rating, onClose }: { confirmed: ConfirmedRide; rating: string; onClose: () => void }) {
  return (
    <div className="animate-glass-condense space-y-5 overflow-y-auto">
      <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase text-primary">Chauffeur TAXI PROXI</p><h2 className="text-xl font-black">Détails du chauffeur</h2></div><Button size="icon" variant="ghost" className="rounded-full" onClick={onClose}><X /></Button></div>
      <div className="flex items-center gap-4"><div className="grid h-24 w-24 place-items-center rounded-3xl bg-primary/10"><FluentEmoji name="oncoming-taxi" className="h-20 w-20" /></div><div><h3 className="text-xl font-black">{confirmed.driverName}</h3><p className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-primary text-primary" /> {rating} · 120+ courses</p><div className="mt-2 flex flex-wrap gap-1"><Tag>Vérifié CUY</Tag><Tag>Expérimenté</Tag><Tag>Top Rated</Tag></div></div></div>
      <div className="rounded-2xl border border-glass-border bg-secondary p-4"><FluentEmoji name="taxi" className="mx-auto h-28 w-28" /><div className="mt-2 grid grid-cols-2 gap-3"><Info label="Véhicule" value={confirmed.vehicle ?? "Toyota Corolla jaune"} /><Info label="Plaque" value={confirmed.plate ?? "CE 1234 A"} /><Info label="Téléphone" value={formatPhone(confirmed.driverPhone)} /><Info label="Catégorie" value="Taxi conventionnel" /></div></div>
      <div className="flex gap-2"><Button asChild className="h-12 flex-1 rounded-xl"><a href={`tel:${confirmed.driverPhone}`}><Phone /> Appeler</a></Button><Button asChild variant="outline" className="h-12 flex-1 rounded-xl"><a href={`sms:${confirmed.driverPhone}`}><MessageCircle /> Chat</a></Button></div>
      <div className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/8 p-4"><FluentEmoji name="shield" className="h-12 w-12 shrink-0" /><p className="text-sm text-muted-foreground"><strong className="text-foreground">Votre sécurité d’abord.</strong><br />Tous nos chauffeurs sont vérifiés par la Communauté Urbaine de Yaoundé.</p></div>
    </div>
  );
}

function Action({ icon: Icon, label, href, onClick }: { icon: typeof Phone; label: string; href?: string; onClick?: () => void }) {
  const content = <><Icon className="h-4 w-4 text-primary" /><span className="text-[10px] font-semibold">{label}</span></>;
  const className = "flex h-14 flex-col items-center justify-center gap-1 rounded-xl border border-glass-border bg-secondary/75";
  return href ? <a href={href} className={className}>{content}</a> : <button type="button" onClick={onClick} className={className}>{content}</button>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-muted/60 p-2 text-center"><p className="text-[9px] uppercase text-muted-foreground">{label}</p><p className="mt-1 text-xs font-black">{value}</p></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="min-w-0"><p className="text-[9px] font-bold uppercase text-muted-foreground">{label}</p><p className="mt-0.5 truncate text-xs font-bold">{value}</p></div>; }
function Tag({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-primary/12 px-2 py-1 text-[9px] font-black text-primary">{children}</span>; }