import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Share2,
  Star,
  X,
  AlertCircle,
  Navigation2,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { MapView } from "@/components/MapView";
import { FluentEmoji } from "@/components/FluentEmoji";
import { Button } from "@/components/ui/button";
import type { LiveDriver } from "@/hooks/useDriverPositions";
import type { GeoPosition } from "@/hooks/useGeolocation";
import type { Ride, RidePhase } from "@/lib/store";
import { toast } from "sonner";

export type ConfirmedRide = {
  rideId: string;
  startPin: string;
  driverName: string;
  driverPhone: string;
  plate?: string;
  vehicle?: string;
  rating?: number;
  total: number;
  routePolyline?: string | null;
  pickupAddress?: string;
};

interface RideExperienceProps {
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
}

const formatPhone = (phone: string) =>
  phone.startsWith("+") ? phone : `+237 ${phone.replace(/\D/g, "")}`;

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
}: RideExperienceProps) {
  const [expandedDetails, setExpandedDetails] = useState(false);
  const [showChatOption, setShowChatOption] = useState(false);

  const phase: RidePhase = ride?.phase ?? "chauffeur_en_route";
  const isCompleted = ride?.status === "completed" || phase === "arrive";
  const isOnTrip = phase === "en_course";
  const isDriverArrived = phase === "chauffeur_arrive";
  const isSearching = Boolean(
    requestId && searchingDrivers > 0 && !isDriverArrived && !isOnTrip && !isCompleted
  );

  const rating =
    confirmed.rating && confirmed.rating > 0 ? confirmed.rating.toFixed(1) : "4.8";
  const pickupLocation = confirmed.pickupAddress ?? "Bastos, Yaoundé";
  const dropoffLocation = destination || "Poste Centrale, Yaoundé";

  const pickupTime = useMemo(
    () =>
      new Date(ride?.startedAt ?? ride?.createdAt ?? Date.now()).toLocaleTimeString(
        "fr-CM",
        { hour: "2-digit", minute: "2-digit" }
      ),
    [ride?.startedAt, ride?.createdAt]
  );

  const arrivalTime = useMemo(
    () =>
      new Date(
        Date.now() + (remaining?.durationMin ?? etaMin ?? 8) * 60000
      ).toLocaleTimeString("fr-CM", { hour: "2-digit", minute: "2-digit" }),
    [remaining?.durationMin, etaMin]
  );

  const distanceTotal = ride?.distanceKm ?? remaining?.distanceKm ?? 4.2;
  const distanceRemaining =
    remaining?.distanceKm ??
    Math.max(0.4, Number((distanceTotal * 0.4).toFixed(1)));
  const distanceCovered = Math.max(
    0,
    Number((distanceTotal - distanceRemaining).toFixed(1))
  );

  const shareRide = async () => {
    const text = `Je suis en course TAXI PROXI vers ${dropoffLocation}. Chauffeur : ${confirmed.driverName}, plaque ${confirmed.plate ?? "CE 1234 A"}. PIN : ${confirmed.startPin}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Ma course TAXI PROXI", text });
      } catch {
        /* share annulé */
      }
    } else {
      await navigator.clipboard?.writeText(text);
      toast.success("Informations de course copiées");
    }
  };

  // =========================================================================
  // ÉCRAN FIN DE COURSE
  // =========================================================================
  if (isCompleted) {
    return (
      <div className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-2xl rounded-t-3xl bg-background p-6 pb-8 shadow-2xl">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold">Course terminée !</h1>
            <p className="text-center text-muted-foreground">
              Merci d'avoir choisi TAXI PROXI
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-secondary p-4">
              <div className="flex items-center gap-3">
                <FluentEmoji name="taxi" className="h-12 w-12" />
                <div className="flex-1">
                  <p className="font-bold">{confirmed.driverName}</p>
                  <p className="text-xs text-muted-foreground">
                    {confirmed.vehicle ?? "Taxi jaune"} • {confirmed.plate}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {confirmed.total.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-secondary p-3">
                <p className="text-xs text-muted-foreground">Départ</p>
                <p className="font-bold">{pickupTime}</p>
              </div>
              <div className="rounded-xl bg-secondary p-3">
                <p className="text-xs text-muted-foreground">Arrivée</p>
                <p className="font-bold">
                  {new Date().toLocaleTimeString("fr-CM", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="space-y-2 rounded-xl bg-secondary p-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Prise en charge</p>
                  <p className="font-semibold">{pickupLocation}</p>
                </div>
              </div>
              <div className="border-t border-glass-border" />
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Dépose</p>
                  <p className="font-semibold">{dropoffLocation}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-12"
                onClick={() => setExpandedDetails(true)}
              >
                <Star className="h-4 w-4 mr-2" /> Évaluer
              </Button>
              <Button
                className="flex-1 rounded-xl h-12 bg-primary"
                onClick={onReset}
              >
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ÉCRANS ACTIFS (Recherche, Arrivée, En cours)
  // =========================================================================
  return (
    <div className="fixed inset-0 z-40 overflow-hidden bg-background">
      {/* Carte plein écran */}
      <MapView
        drivers={drivers}
        me={position ? { lat: position.lat, lng: position.lng } : null}
        routePolyline={routePolyline}
        className="absolute inset-0 h-full w-full"
        theme="standard"
      />

      {/* Gradient overlay en haut */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/30 via-black/10 to-transparent" />

      {/* HEADER - Infos rapides */}
      <div className="absolute left-0 right-0 top-0 z-10 px-4 pt-3 safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-primary">
              TP
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {isSearching
                  ? "Recherche du chauffeur..."
                  : isOnTrip
                  ? `${remaining?.durationMin ?? 7} min`
                  : "Chauffeur en route"}
              </p>
              <p className="text-[11px] text-white/80">
                {isSearching
                  ? `${searchingDrivers} taxis notifiés`
                  : isOnTrip
                  ? `${distanceRemaining.toFixed(1)} km restants`
                  : `Arrive dans ${etaMin ?? 3} min`}
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-primary px-3 py-1.5 text-center">
            <p className="text-[9px] font-bold text-white uppercase tracking-widest">PIN</p>
            <p className="font-mono text-sm font-bold text-white">
              {confirmed.startPin}
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM SHEET - Contenu principal */}
      <section
        className={`absolute inset-x-0 bottom-0 transition-all duration-300 ease-out ${
          expandedDetails ? "top-0" : "top-auto"
        }`}
      >
        <div className="mx-auto w-full max-w-2xl rounded-t-[28px] border-t border-primary/10 bg-background shadow-2xl">
          {/* Handle bar */}
          <div className="flex justify-center py-2">
            <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </div>

          {/* RECHERCHE EN COURS */}
          {isSearching && (
            <div className="px-4 pb-8 pt-2 space-y-4">
              <div>
                <h2 className="text-xl font-bold">Recherche du chauffeur</h2>
                <p className="text-sm text-muted-foreground">
                  Nous trouvons le meilleur chauffeur pour vous
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <Zap className="h-5 w-5 text-primary animate-pulse" />
                </div>
                <div>
                  <p className="font-bold">{searchingDrivers} taxis CUY notifiés</p>
                  <p className="text-xs text-muted-foreground">Chauffeurs à proximité</p>
                </div>
              </div>

              <LocationCard
                type="pickup"
                title="Prise en charge"
                location={pickupLocation}
              />
              <LocationCard
                type="dropoff"
                title="Dépose"
                location={dropoffLocation}
              />

              <div className="rounded-xl bg-secondary p-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Tarif estimé</p>
                <p className="text-2xl font-bold text-primary">
                  {confirmed.total.toLocaleString("fr-FR")} FCFA
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full rounded-xl h-12 font-bold"
                onClick={onCancel}
              >
                <X className="h-4 w-4 mr-2" /> Annuler
              </Button>
            </div>
          )}

          {/* CHAUFFEUR ARRIVÉ / EN ROUTE */}
          {(isDriverArrived || (!isOnTrip && !isSearching)) && (
            <div className="px-4 pb-8 pt-2 space-y-4">
              {/* Carte chauffeur principal */}
              <button
                type="button"
                onClick={() => setExpandedDetails(true)}
                className="w-full rounded-2xl bg-primary/5 border border-primary/20 p-4 text-left transition hover:bg-primary/10"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-16 shrink-0">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center overflow-hidden">
                      <FluentEmoji name="oncoming-taxi" className="h-12 w-12" />
                    </div>
                    <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background bg-green-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{confirmed.driverName}</p>
                      <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary">
                        CUY Vérifié
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-semibold">{rating}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {confirmed.vehicle ?? "Toyota Corolla"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase">Plaque</p>
                    <p className="font-mono font-bold text-primary">
                      {confirmed.plate}
                    </p>
                  </div>
                </div>
              </button>

              {/* Statut */}
              <div className="rounded-xl bg-secondary p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">
                    {isDriverArrived
                      ? "Chauffeur arrivé"
                      : `Arrive dans ${etaMin ?? 3} minutes`}
                  </p>
                </div>
                <p className="text-lg font-bold text-primary">
                  {isDriverArrived ? "🎯" : `${etaMin ?? 3}'`}
                </p>
              </div>

              {/* Actions rapides */}
              <div className="grid grid-cols-2 gap-3">
                <ActionButton
                  icon={Phone}
                  label="Appeler"
                  href={`tel:${confirmed.driverPhone}`}
                />
                <ActionButton
                  icon={MessageCircle}
                  label="Message"
                  href={`sms:${confirmed.driverPhone}`}
                />
                <ActionButton
                  icon={Share2}
                  label="Partager"
                  onClick={() => void shareRide()}
                />
                <ActionButton
                  icon={Navigation2}
                  label="Voir la carte"
                  onClick={() => setExpandedDetails(!expandedDetails)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-12"
                  onClick={onCancel}
                >
                  <X className="h-4 w-4 mr-1" /> Annuler
                </Button>
                <Button className="flex-1 rounded-xl h-12 bg-primary" onClick={() => setShowChatOption(true)}>
                  <Navigation className="h-4 w-4 mr-2" /> Suivre
                </Button>
              </div>
            </div>
          )}

          {/* EN COURS DE RIDE */}
          {isOnTrip && (
            <div className="px-4 pb-8 pt-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Course en cours</h2>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                  <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                </div>
              </div>

              {/* Progression visuelle */}
              <div className="rounded-xl bg-secondary p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    A
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Prise en charge</p>
                    <p className="font-semibold">{pickupTime}</p>
                  </div>
                </div>
                <div className="ml-3 h-8 border-l-2 border-dashed border-primary/40" />
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary text-xs font-bold text-primary">
                    B
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Destination</p>
                    <p className="font-semibold">{dropoffLocation}</p>
                  </div>
                </div>
              </div>

              {/* Métriques */}
              <div className="grid grid-cols-3 gap-2">
                <MetricItem label="Parcouru" value={`${distanceCovered.toFixed(1)} km`} />
                <MetricItem label="Restant" value={`${distanceRemaining.toFixed(1)} km`} />
                <MetricItem label="Arrivée" value={arrivalTime} />
              </div>

              {/* Tarif en temps réel */}
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-bold uppercase">
                      Tarif en temps réel
                    </p>
                    <p className="text-3xl font-bold text-primary mt-1">
                      {confirmed.total.toLocaleString("fr-FR")} FCFA
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-primary opacity-50" />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1 text-destructive"
                  onClick={onCancel}
                >
                  Annuler la course
                </Button>
                <Button className="flex-1 bg-primary" onClick={() => setExpandedDetails(true)}>
                  <Navigation className="h-4 w-4 mr-2" /> Voir la carte
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Détails complets en modal */}
      {expandedDetails && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-t-3xl bg-background p-6 pb-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Détails du voyage</h2>
              <button
                type="button"
                onClick={() => setExpandedDetails(false)}
                className="rounded-full p-2 hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Chauffeur */}
              <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
                    <FluentEmoji name="oncoming-taxi" className="h-16 w-16" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{confirmed.driverName}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-bold">{rating}</span>
                      <span className="text-xs text-muted-foreground">
                        • 150+ trajets
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {confirmed.vehicle} • {confirmed.plate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Itinéraire */}
              <LocationCard
                type="pickup"
                title="Prise en charge"
                location={pickupLocation}
                time={pickupTime}
              />
              <LocationCard
                type="dropoff"
                title="Destination"
                location={dropoffLocation}
                time={arrivalTime}
              />

              {/* Tarif */}
              <div className="rounded-2xl bg-secondary p-4">
                <p className="text-sm text-muted-foreground font-bold uppercase mb-2">
                  Détails du paiement
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Trajet</span>
                    <span className="font-bold">
                      {confirmed.total.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                  <div className="border-t border-glass-border pt-2 flex items-center justify-between">
                    <span className="font-bold">Total</span>
                    <span className="text-lg font-bold text-primary">
                      {confirmed.total.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button asChild variant="outline" className="rounded-xl h-12">
                  <a href={`tel:${confirmed.driverPhone}`}>
                    <Phone className="h-4 w-4 mr-2" /> Appeler
                  </a>
                </Button>
                <Button asChild variant="outline" className="rounded-xl h-12">
                  <a href={`sms:${confirmed.driverPhone}`}>
                    <MessageCircle className="h-4 w-4 mr-2" /> Message
                  </a>
                </Button>
              </div>

              {/* Sécurité */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold">Confiance & Sécurité</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tous nos chauffeurs TAXI PROXI sont vérifiés par la CUY et
                    formés aux normes de sécurité.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Composants utilitaires */

function LocationCard({
  type,
  title,
  location,
  time,
}: {
  type: "pickup" | "dropoff";
  title: string;
  location: string;
  time?: string;
}) {
  return (
    <div className="rounded-xl bg-secondary p-4 flex gap-3">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-bold shrink-0 ${
          type === "pickup" ? "bg-primary" : "bg-destructive"
        }`}
      >
        {type === "pickup" ? "A" : "B"}
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground font-bold uppercase">{title}</p>
        <p className="font-semibold">{location}</p>
        {time && <p className="text-xs text-muted-foreground mt-1">{time}</p>}
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  href,
  onClick,
}: {
  icon: typeof Phone;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const className =
    "flex flex-col items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 font-bold text-sm transition hover:bg-primary/10";

  const content = (
    <>
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-[11px]">{label}</span>
    </>
  );

  return href ? (
    <a href={href} className={className}>
      {content}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function MetricItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-secondary p-3 text-center">
      <p className="text-[10px] text-muted-foreground font-bold uppercase">
        {label}
      </p>
      <p className="text-sm font-bold mt-1">{value}</p>
    </div>
  );
}
