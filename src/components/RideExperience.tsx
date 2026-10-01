import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  LocateFixed,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Radio,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
  X,
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTabOverride, setActiveTabOverride] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"cash" | "momo" | "om">("cash");

  const phase: RidePhase = ride?.phase ?? "chauffeur_en_route";
  const isCompleted = ride?.status === "completed" || phase === "arrive";
  const isOnTrip = phase === "en_course";
  const isDriverArrived = phase === "chauffeur_arrive";
  const isSearching = Boolean(requestId && searchingDrivers > 0 && !isDriverArrived && !isOnTrip && !isCompleted);

  const activeScreen = activeTabOverride ?? (
    isCompleted ? 6 :
    detailsOpen ? 5 :
    isOnTrip && isExpanded ? 4 :
    isOnTrip ? 3 :
    isDriverArrived ? 2 :
    isSearching ? 1 :
    2
  );

  const rating = confirmed.rating && confirmed.rating > 0 ? confirmed.rating.toFixed(1) : "4.9";
  const pickupLocation = confirmed.pickupAddress ?? "Bastos, Carrefour du Palais";
  const dropoffLocation = destination || "Poste Centrale, Yaoundé";

  const pickupTime = useMemo(
    () =>
      new Date(ride?.startedAt ?? ride?.createdAt ?? Date.now()).toLocaleTimeString("fr-CM", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [ride?.startedAt, ride?.createdAt]
  );

  const arrivalTime = useMemo(
    () =>
      new Date(Date.now() + (remaining?.durationMin ?? etaMin ?? 8) * 60000).toLocaleTimeString("fr-CM", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [remaining?.durationMin, etaMin]
  );

  const distanceTotal = ride?.distanceKm ?? remaining?.distanceKm ?? 4.2;
  const distanceRemaining = remaining?.distanceKm ?? Math.max(0.4, Number((distanceTotal * 0.4).toFixed(1)));
  const distanceCovered = Math.max(0, Number((distanceTotal - distanceRemaining).toFixed(1)));

  const shareRide = async () => {
    const text = `Je suis en course TAXI PROXI vers ${dropoffLocation}. Chauffeur : ${confirmed.driverName}, plaque ${confirmed.plate ?? "CE 1234 A"}. PIN : ${confirmed.startPin}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Ma course TAXI PROXI", text });
      } catch {
        // share annulé
      }
    } else {
      await navigator.clipboard?.writeText(text);
      toast.success("Informations de course copiées dans le presse-papier");
    }
  };

  if (activeScreen === 6) {
    return (
      <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-background px-4 py-8">
        <section className="w-full max-w-md animate-glass-condense space-y-5 text-center">
          <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-full bg-primary/15 ring-2 ring-primary/40">
            <FluentEmoji name="check" className="h-20 w-20 animate-taxi-breathe" alt="Course terminée" />
          </div>

          <div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-primary">
              Arrivé à destination · Yaoundé
            </span>
            <h1 className="mt-2 text-3xl font-black text-foreground">Course terminée !</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Merci d'avoir voyagé avec un taxi conventionnel vérifié CUY.
            </p>
          </div>

          <div className="liquid-glass rounded-3xl p-5 text-left shadow-2xl">
            <div className="flex items-center gap-3 border-b border-glass-border pb-4">
              <FluentEmoji name="taxi" className="h-12 w-12 shrink-0 drop-shadow-md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-black text-foreground">{confirmed.driverName}</p>
                <p className="text-xs text-muted-foreground">
                  {confirmed.vehicle ?? "Toyota Corolla jaune"} · <span className="font-mono font-bold text-foreground">{confirmed.plate ?? "CE 1234 A"}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Tarif final</p>
                <span className="text-xl font-black text-primary">
                  {confirmed.total.toLocaleString("fr-FR")} FCFA
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-glass-border/40">
                <span className="text-muted-foreground">Prise en charge</span>
                <span className="font-bold text-foreground truncate max-w-[200px]">{pickupLocation}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-glass-border/40">
                <span className="text-muted-foreground">Dépose</span>
                <span className="font-bold text-foreground truncate max-w-[200px]">{dropoffLocation}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-glass-border/40">
                <span className="text-muted-foreground">Horaires</span>
                <span className="font-bold text-foreground">{pickupTime} → {new Date().toLocaleTimeString("fr-CM", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Mode de règlement</p>
              <div className="grid grid-cols-3 gap-2">
                <PaymentPill active={selectedPaymentMethod === "cash"} onClick={() => setSelectedPaymentMethod("cash")} label="Espèces" sub="Au chauffeur" />
                <PaymentPill active={selectedPaymentMethod === "om"} onClick={() => setSelectedPaymentMethod("om")} label="Orange" sub="#150#" />
                <PaymentPill active={selectedPaymentMethod === "momo"} onClick={() => setSelectedPaymentMethod("momo")} label="MTN MoMo" sub="*126#" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-left">
            <div className="flex items-center gap-3">
              <FluentEmoji name="star" className="h-10 w-10 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-black text-foreground flex items-center gap-1">
                  Proxi Rewards <Sparkles className="h-3.5 w-3.5 text-primary" />
                </p>
                <p className="text-xs text-muted-foreground">
                  +50 points gagnés sur cette course conventionnelle.
                </p>
              </div>
            </div>
          </div>

          <Button className="h-14 w-full rounded-2xl text-base font-black shadow-lg" onClick={onReset}>
            Retour à l'accueil
          </Button>

          <ScreenSwitcher current={activeScreen} onSelect={setActiveTabOverride} />
        </section>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 overflow-hidden bg-background">
      <MapView
        drivers={drivers}
        me={position ? { lat: position.lat, lng: position.lng } : null}
        routePolyline={routePolyline}
        className="absolute inset-0 h-full w-full"
        theme="standard"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background/90 via-background/40 to-transparent" />

      <header className="liquid-glass absolute left-3 right-3 top-[max(0.75rem,env(safe-area-inset-top))] flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl backdrop-blur-xl md:left-1/2 md:max-w-md md:-translate-x-1/2">
        <FluentEmoji
          name={activeScreen === 1 ? "taxi" : activeScreen >= 3 ? "taxi" : "oncoming-taxi"}
          className="h-11 w-11 shrink-0 animate-taxi-breathe"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-foreground">
            {activeScreen === 1
              ? "Recherche de votre taxi..."
              : activeScreen === 2
              ? (isDriverArrived ? "Votre chauffeur est arrivé" : `Chauffeur à ${etaMin ?? 3} min`)
              : activeScreen === 5
              ? "Profil & Véhicule CUY"
              : `${remaining?.durationMin ?? 7} min restantes`}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {activeScreen === 1
              ? `${searchingDrivers || 4} taxis CUY notifiés autour`
              : activeScreen === 2
              ? `Vers ${dropoffLocation}`
              : `${distanceRemaining} km · Arrivée estimée ${arrivalTime}`}
          </p>
        </div>

        {activeScreen !== 1 && (
          <div className="rounded-xl bg-primary px-3 py-1.5 text-center text-primary-foreground shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-wider">PIN</p>
            <p className="font-mono text-sm font-black">{confirmed.startPin}</p>
          </div>
        )}
      </header>

      <section
        className={`absolute inset-x-0 bottom-0 transition-all duration-500 ease-out ${
          detailsOpen || activeScreen === 5 || isExpanded || activeScreen === 4
            ? "top-[16dvh]"
            : "top-auto"
        }`}
      >
        <div className="mx-auto max-w-lg rounded-t-[32px] border-t border-glass-border bg-card/95 p-5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-2xl">
          <button
            type="button"
            className="mx-auto mb-3 block p-1"
            onClick={() => {
              if (detailsOpen) setDetailsOpen(false);
              else setIsExpanded((prev) => !prev);
            }}
            aria-label="Ajuster la vue"
          >
            <span className="block h-1.5 w-12 rounded-full bg-muted-foreground/35" />
          </button>

          {activeScreen === 1 && (
            <div className="space-y-4 animate-glass-condense">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-foreground">Recherche de votre taxi...</h2>
                  <p className="text-xs text-muted-foreground">Assignation au chauffeur conventionnel le plus proche</p>
                </div>
                <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-black text-primary">
                  Vérifié CUY
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1 rounded-xl bg-secondary/60 p-2 text-center text-[10px] font-black">
                <div className="rounded-lg bg-primary text-primary-foreground py-1">1. Recherche</div>
                <div className="rounded-lg text-muted-foreground py-1">2. Assigné</div>
                <div className="rounded-lg text-muted-foreground py-1">3. En route</div>
              </div>

              <div className="rounded-2xl border border-glass-border bg-secondary/40 p-3 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="mt-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-black">
                    A
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Lieu de prise en charge</p>
                    <p className="truncate text-xs font-black text-foreground">{pickupLocation}</p>
                  </div>
                </div>
                <div className="ml-2.5 h-3 border-l-2 border-dashed border-primary/40" />
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-5 w-5 text-destructive" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Lieu de dépose</p>
                    <p className="truncate text-xs font-black text-foreground">{dropoffLocation}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-2.5 text-xs">
                <span className="text-muted-foreground">Tarif fixe garanti :</span>
                <span className="text-sm font-black text-primary">{confirmed.total.toLocaleString("fr-FR")} FCFA</span>
              </div>

              <Button variant="outline" className="h-12 w-full rounded-xl border-glass-border text-xs font-bold" onClick={onCancel}>
                <X className="mr-1 h-4 w-4" /> Annuler la recherche
              </Button>
            </div>
          )}

          {activeScreen === 2 && (
            <div className="space-y-4 animate-glass-condense">
              <button
                type="button"
                onClick={() => setDetailsOpen(true)}
                className="flex w-full items-center gap-3 rounded-2xl border border-glass-border bg-secondary/60 p-3.5 text-left transition hover:bg-secondary/80"
              >
                <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary/15">
                  <FluentEmoji name="oncoming-taxi" className="h-11 w-11" />
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-black text-foreground">{confirmed.driverName}</p>
                    <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-black text-primary">
                      Taxi CUY
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" /> {rating} · 140+ courses
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {confirmed.vehicle ?? "Toyota Corolla jaune"}
                  </p>
                </div>

                <div className="rounded-xl border border-primary/30 bg-background/80 px-3 py-2 text-right shadow-sm">
                  <p className="text-[9px] font-bold uppercase text-muted-foreground">CM</p>
                  <p className="font-mono text-xs font-black text-primary">{confirmed.plate ?? "CE 1234 A"}</p>
                </div>
              </button>

              <div className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-2 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  {isDriverArrived ? "Chauffeur sur place" : "Temps estimé :"}
                </span>
                <span className="font-black text-foreground">
                  {isDriverArrived ? "Au point de ramassage" : `${etaMin ?? 3} minutes`}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <ActionBtn href={`tel:${confirmed.driverPhone}`} icon={Phone} label="Appeler" />
                <ActionBtn href={`sms:${confirmed.driverPhone}`} icon={MessageCircle} label="Chat" />
                <ActionBtn onClick={() => void shareRide()} icon={Share2} label="Partager" />
                <ActionBtn onClick={() => toast.success("Position GPS en direct partagée")} icon={LocateFixed} label="Position" />
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="h-12 flex-1 rounded-xl border-glass-border text-xs font-bold" onClick={onCancel}>
                  <X className="mr-1 h-3.5 w-3.5" /> Annuler
                </Button>
                <Button
                  className="h-12 flex-[1.7] rounded-xl text-xs font-black bg-primary text-primary-foreground shadow-lg"
                  onClick={() => setIsExpanded((prev) => !prev)}
                >
                  <Navigation className="mr-1.5 h-4 w-4" /> Voir sur la carte
                </Button>
              </div>
            </div>
          )}

          {activeScreen === 3 && (
            <div className="space-y-4 animate-glass-condense">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-emerald-500 animate-pulse" />
                  <span className="text-xs font-black uppercase text-foreground">Course en direct</span>
                </div>
                <span className="text-xs font-black text-primary">{remaining?.durationMin ?? 7} min restantes</span>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-3">
                <FluentEmoji name="taxi" className="h-10 w-10 shrink-0" />
                <div className="min-w-0 flex-1 text-xs">
                  <p className="font-bold text-foreground">{confirmed.driverName}</p>
                  <p className="text-[11px] text-muted-foreground">{confirmed.plate ?? "CE 1234 A"}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Arrivée estimée</p>
                  <p className="font-bold text-foreground">{arrivalTime}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-xl bg-secondary/40 p-2.5">
                  <p className="text-[10px] text-muted-foreground">Prise en charge</p>
                  <p className="font-bold text-foreground">{pickupTime}</p>
                </div>
                <div className="rounded-xl bg-secondary/40 p-2.5">
                  <p className="text-[10px] text-muted-foreground">Tarif convenu</p>
                  <p className="font-black text-primary">{confirmed.total.toLocaleString("fr-FR")} FCFA</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button variant="ghost" size="sm" className="text-muted-foreground text-xs hover:text-destructive" onClick={onCancel}>
                  Annuler la course
                </Button>
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="flex items-center gap-1 text-xs font-bold text-primary"
                >
                  Vue étendue <ChevronUp className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {activeScreen === 4 && (
            <div className="space-y-4 animate-glass-condense">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-foreground">Suivi télémétrique</h3>
                  <p className="text-xs text-muted-foreground">Mise à jour GPS en temps réel</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="flex items-center gap-1 text-xs font-bold text-primary"
                >
                  Réduire <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <MetricCard label="Parcouru" value={`${distanceCovered} km`} />
                <MetricCard label="Restant" value={`${distanceRemaining} km`} />
                <MetricCard label="ETA" value={arrivalTime} />
              </div>

              <div className="rounded-2xl border border-glass-border bg-secondary/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Tarif temps réel</p>
                    <p className="text-2xl font-black text-primary">{confirmed.total.toLocaleString("fr-FR")} FCFA</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" asChild className="h-10 w-10 rounded-xl">
                      <a href={`tel:${confirmed.driverPhone}`}><Phone className="h-4 w-4 text-primary" /></a>
                    </Button>
                    <Button size="icon" variant="outline" asChild className="h-10 w-10 rounded-xl">
                      <a href={`sms:${confirmed.driverPhone}`}><MessageCircle className="h-4 w-4 text-primary" /></a>
                    </Button>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="h-12 w-full rounded-xl border-glass-border font-bold text-xs"
                onClick={() => setDetailsOpen(true)}
              >
                Voir la fiche complète du chauffeur CUY
              </Button>
            </div>
          )}

          {activeScreen === 5 && (
            <div className="space-y-4 animate-glass-condense">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-primary">Chauffeur officiel Yaoundé</span>
                  <h3 className="text-lg font-black text-foreground">Détails du chauffeur</h3>
                </div>
                <Button size="icon" variant="ghost" className="rounded-full" onClick={() => setDetailsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-primary/15">
                  <FluentEmoji name="oncoming-taxi" className="h-16 w-16" />
                </div>
                <div>
                  <h4 className="text-base font-black text-foreground">{confirmed.driverName}</h4>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" /> {rating} · 150+ trajets effectués
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <BadgePill>Vérifié CUY</BadgePill>
                    <BadgePill>Expérimenté</BadgePill>
                    <BadgePill>Top Rated</BadgePill>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-glass-border bg-secondary/50 p-4">
                <FluentEmoji name="taxi" className="mx-auto h-20 w-20 drop-shadow-md" />
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Véhicule</span>
                    <strong className="text-foreground">{confirmed.vehicle ?? "Toyota Corolla jaune"}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Immatriculation</span>
                    <strong className="font-mono text-primary">{confirmed.plate ?? "CE 1234 A"}</strong>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-glass-border/40">
                    <span className="text-[10px] text-muted-foreground block">Téléphone direct</span>
                    <strong className="font-mono text-foreground">{formatPhone(confirmed.driverPhone)}</strong>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button asChild className="h-12 flex-1 rounded-xl bg-primary text-primary-foreground font-black">
                  <a href={`tel:${confirmed.driverPhone}`}><Phone className="mr-1 h-4 w-4" /> Appeler</a>
                </Button>
                <Button asChild variant="outline" className="h-12 flex-1 rounded-xl border-glass-border font-bold">
                  <a href={`sms:${confirmed.driverPhone}`}><MessageCircle className="mr-1 h-4 w-4" /> Chat</a>
                </Button>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-3.5 text-xs">
                <FluentEmoji name="shield" className="h-9 w-9 shrink-0" />
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Confiance & Sécurité :</strong><br />
                  Tous nos chauffeurs et leurs cartes grises sont vérifiés par la Communauté Urbaine de Yaoundé (CUY).
                </p>
              </div>
            </div>
          )}

          <ScreenSwitcher current={activeScreen} onSelect={setActiveTabOverride} />
        </div>
      </section>
    </div>
  );
}

function ActionBtn({
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
  const content = (
    <>
      <Icon className="h-4 w-4 text-primary" />
      <span className="text-[10px] font-semibold text-foreground">{label}</span>
    </>
  );
  const className =
    "flex h-14 flex-col items-center justify-center gap-1 rounded-xl border border-glass-border bg-secondary/70 transition active:scale-95";
  return href ? (
    <a href={href} className={className}>{content}</a>
  ) : (
    <button type="button" onClick={onClick} className={className}>{content}</button>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 p-2.5 text-center">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xs font-black text-foreground">{value}</p>
    </div>
  );
}

function BadgePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-black text-primary">
      {children}
    </span>
  );
}

function PaymentPill({
  active,
  onClick,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-2 text-center transition ${
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-glass-border bg-secondary/30 text-muted-foreground"
      }`}
    >
      <p className="text-xs font-black">{label}</p>
      <p className="text-[9px] opacity-75">{sub}</p>
    </button>
  );
}

function ScreenSwitcher({
  current,
  onSelect,
}: {
  current: number;
  onSelect: (screen: number | null) => void;
}) {
  return (
    <div className="mt-4 pt-3 border-t border-glass-border/40">
      <div className="flex items-center justify-between mb-1.5 text-[10px] text-muted-foreground">
        <span>Navigation aperçu des 6 écrans :</span>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="text-primary hover:underline font-bold"
        >
          Auto (Temps réel)
        </button>
      </div>
      <div className="grid grid-cols-6 gap-1 text-[10px] font-bold">
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onSelect(num)}
            className={`py-1 rounded-lg transition ${
              current === num
                ? "bg-primary text-primary-foreground font-black shadow-sm"
                : "bg-secondary/40 text-muted-foreground hover:bg-secondary/70"
            }`}
          >
            Écran {num}
          </button>
        ))}
      </div>
    </div>
  );
}
