import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useStore, type VehicleClass } from "@/lib/store";
import { estimateRoute } from "@/lib/route.functions";
import { notifyNearbyDrivers } from "@/lib/push.functions";
import { usePricingRules, vehicleClassToCategory, computeDynamicFare } from "@/lib/pricing";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useLiveRoute } from "@/hooks/useLiveRoute";
import { useDriverPositions } from "@/hooks/useDriverPositions";
import { supabase } from "@/integrations/supabase/client";
import { MapView } from "@/components/MapView";
import { RideProgress } from "@/components/RideProgress";
import { DestinationInput } from "@/components/DestinationInput";
import { DriverInfoCard } from "@/components/DriverInfoCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Car, Crown, Bike, Tag, Loader2, MapPin, Navigation, ShieldCheck, LogIn, Locate, Banknote, Check, Sparkles } from "lucide-react";

const classes: { id: VehicleClass; label: string; sub: string; icon: any }[] = [
  { id: "moto", label: "Bend-Skin", sub: "Moto-taxi · rapide", icon: Bike },
  { id: "eco", label: "Éco", sub: "Voiture standard", icon: Car },
  { id: "confort", label: "Confort", sub: "Berline climatisée", icon: Crown },
];

const GUEST_RIDE_KEY = "taxi-proxi-guest-ride-used";

export function Course() {
  const { drivers, addRide, applyPromo, addClient, clients, rides } = useStore();
  const { rules: pricingRules, error: pricingError } = usePricingRules();
  const { user } = useAuth();
  const estimate = useServerFn(estimateRoute);
  const notifyDrivers = useServerFn(notifyNearbyDrivers);
  const { position, error: geoError } = useGeolocation(true);
  const liveDrivers = useDriverPositions();

  const [profile, setProfile] = useState<{ name: string; phone: string; quartier: string } | null>(null);
  const [guest, setGuest] = useState({ name: "", phone: "" });
  const [guestUsed, setGuestUsed] = useState(false);

  useEffect(() => {
    try { setGuestUsed(localStorage.getItem(GUEST_RIDE_KEY) === "1"); } catch { /* stockage indisponible */ }
  }, []);

  const [to, setTo] = useState("");
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>("eco");
  const [promo, setPromo] = useState("");
  const [routePolyline, setRoutePolyline] = useState<string | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState<null | {
    rideId: string; startPin: string; driverName: string; driverPhone: string;
    plate?: string; vehicle?: string; rating?: number; total: number; routePolyline?: string | null;
  }>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [searchingDrivers, setSearchingDrivers] = useState(0);

  // Suivi temps réel de la demande envoyée aux chauffeurs proches
  useEffect(() => {
    if (!requestId) return;
    const channel = supabase
      .channel(`ride-request-${requestId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ride_requests", filter: `id=eq.${requestId}` },
        async (payload) => {
          const row = payload.new as { status: string; driver_id: string | null };
          if (row.status === "accepted" && row.driver_id) {
            const { data } = await supabase
              .from("drivers")
              .select("name, phone, plate, vehicle, rating")
              .eq("user_id", row.driver_id)
              .maybeSingle();
            if (data) {
              setConfirmed((c) =>
                c
                  ? {
                      ...c,
                      driverName: data.name || c.driverName,
                      driverPhone: data.phone || c.driverPhone,
                      plate: data.plate || c.plate,
                      vehicle: data.vehicle || c.vehicle,
                      rating: Number(data.rating) || c.rating,
                    }
                  : c,
              );
            }
            toast.success("Un chauffeur a accepté votre course 🚖");
            setRequestId(null);
          } else if (row.status === "expired") {
            toast.error("Aucun chauffeur n'a répondu — réessayez");
            setRequestId(null);
          }
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [requestId]);


  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name, phone, quartier").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) setProfile({ name: data.name || "Client", phone: data.phone || "", quartier: data.quartier || "" });
        else setProfile({ name: user.email?.split("@")[0] || "Client", phone: "", quartier: "" });
      });
  }, [user]);

  // Pendant la course : l'itinéraire est recalculé dès que la position GPS bouge
  const liveRoute = useLiveRoute({
    destination: confirmed ? to : null,
    position,
    fallback: confirmed?.routePolyline ?? null,
    enabled: !!confirmed,
  });

  // Course en cours suivie côté client (progression étape par étape)
  const confirmedRide = confirmed ? rides.find((r) => r.id === confirmed.rideId) : undefined;

  // ETA du chauffeur : distance du chauffeur en ligne le plus proche (~22 km/h en ville)
  const etaMin = useMemo(() => {
    if (!position || liveDrivers.length === 0) return null;
    const km = Math.min(
      ...liveDrivers.map((d) => {
        const dLat = ((d.lat - position.lat) * Math.PI) / 180;
        const dLng = ((d.lng - position.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((position.lat * Math.PI) / 180) * Math.cos((d.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        return 2 * 6371 * Math.asin(Math.sqrt(a));
      }),
    );
    return Math.max(1, Math.round((km / 22) * 60));
  }, [position?.lat, position?.lng, liveDrivers]);


  // Position arrondie (~11 m) : évite les recalculs d'itinéraire en boucle
  const posLat = position ? Math.round(position.lat * 1e4) / 1e4 : null;
  const posLng = position ? Math.round(position.lng * 1e4) / 1e4 : null;

  // Auto-estimation : origin = position GPS, destination = saisie
  useEffect(() => {
    const t = to.trim();
    if (t.length < 2 || posLat === null || posLng === null || confirmed) { return; }
    const ctrl = new AbortController();
    setEstimating(true); setEstimateError(null);
    const timer = setTimeout(async () => {
      try {
        const r = await estimate({
          data: { originLat: posLat, originLng: posLng, to: t },
        });
        if (ctrl.signal.aborted) return;
        setDistance(String(r.distanceKm)); setDuration(String(r.durationMin));
        setRoutePolyline(r.polyline ?? null);
      } catch {
        if (ctrl.signal.aborted) return;
        setEstimateError("Destination introuvable — précisez le quartier");
        setDistance(""); setDuration(""); setRoutePolyline(null);
      } finally { if (!ctrl.signal.aborted) setEstimating(false); }
    }, 600);
    return () => { ctrl.abort(); clearTimeout(timer); };
  }, [to, posLat, posLng, estimate, confirmed]);

  const available = useMemo(
    () => drivers.filter((d) => !d.blocked && d.vehicleClass === vehicleClass).sort((a, b) => b.rating - a.rating),
    [drivers, vehicleClass],
  );

  const distKm = parseFloat(distance) || 0;
  const durMin = parseFloat(duration) || 0;
  const currentRule = pricingRules?.[vehicleClassToCategory(vehicleClass)] ?? null;

  const baseTotal = useMemo(() => {
    if (!currentRule || !distKm || !durMin) return 0;
    return computeDynamicFare(distKm, durMin, currentRule);
  }, [currentRule, distKm, durMin]);

  const promoResult = useMemo(
    () => (promo.trim() ? applyPromo(promo, baseTotal) : { ok: false, discount: 0, msg: "" }),
    [promo, baseTotal, applyPromo],
  );
  const finalTotal = baseTotal > 0
    ? Math.ceil(Math.max(currentRule?.minimum_fare ?? 0, baseTotal - (promoResult.ok ? promoResult.discount : 0)) / 50) * 50
    : 0;

  // Invité : une seule course sans compte, ensuite inscription requise
  if (!user && guestUsed) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LogIn className="h-5 w-5 text-primary" /> Créez votre compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Vous avez déjà profité de votre course sans inscription. Créez un compte gratuit pour continuer à
              commander, suivre votre historique et gagner des bonus de parrainage.
            </p>
            <Link to="/auth"><Button className="w-full">Se connecter / S'inscrire</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleBook = async () => {
    if (!to.trim()) { toast.error("Indiquez votre destination"); return; }
    if (!position) { toast.error("Activez la géolocalisation pour réserver"); return; }
    const dist = parseFloat(distance), dur = parseFloat(duration);
    if (!dist || !dur) { toast.error("Itinéraire en cours de calcul…"); return; }
    if (available.length === 0) { toast.error("Aucun chauffeur disponible dans cette catégorie"); return; }
    if (!user) {
      if (guest.name.trim().length < 2) { toast.error("Indiquez votre nom"); return; }
      if (guest.phone.replace(/\D/g, "").length < 8) { toast.error("Indiquez un numéro de téléphone valide"); return; }
    }

    setBooking(true);
    try {
      const name = user ? profile?.name || "Client" : guest.name.trim();
      const phone = user ? profile?.phone || "" : guest.phone.trim();
      let client = clients.find((c) => c.phone && phone && c.phone === phone);
      if (!client) client = addClient({ name, phone, quartier: user ? profile?.quartier || "" : "" });

      const driver = available[0];

      const ride = addRide({
        driverId: driver.id, clientId: client.id,
        from: `Position actuelle (${position.lat.toFixed(4)}, ${position.lng.toFixed(4)})`,
        to: to.trim(),
        distanceKm: dist, durationMin: dur, waitMin: 0,
        baseFare: currentRule ? Math.round(dist * currentRule.price_per_km) : 0,
        timeSurcharge: currentRule ? Math.round(dur * currentRule.price_per_min) : 0,
        waitSurcharge: 0,
        peakMultiplier: 1, vehicleClass, classMultiplier: 1,
        promoCode: promoResult.ok ? promo.trim().toUpperCase() : undefined,
        promoDiscount: promoResult.ok ? promoResult.discount : undefined,
        total: finalTotal,
        routePolyline: routePolyline ?? undefined,
      });
      if (!ride) { toast.error("Chauffeur indisponible"); return; }

      if (!user) {
        try { localStorage.setItem(GUEST_RIDE_KEY, "1"); } catch { /* stockage indisponible */ }
        setGuestUsed(true);
      }

      setConfirmed({
        rideId: ride.id, startPin: ride.startPin,
        driverName: driver.name, driverPhone: driver.phone,
        plate: driver.plate, vehicle: driver.vehicle, rating: driver.rating, total: finalTotal,
        routePolyline,
      });

      // Dispatch temps réel : fait sonner les chauffeurs vérifiés à moins de 2 km
      if (user) {
        try {
          const { data: req } = await supabase
            .from("ride_requests")
            .insert({
              client_id: user.id,
              client_name: name,
              client_phone: phone,
              origin_lat: position.lat,
              origin_lng: position.lng,
              destination: to.trim(),
              distance_km: dist,
              duration_min: Math.round(dur),
              vehicle_class: vehicleClass,
              fare: finalTotal,
            })
            .select("id")
            .single();
          if (req) {
            setRequestId(req.id);
            const { data: count, error: dispatchError } = await supabase.rpc("dispatch_ride_request", {
              _request_id: req.id,
            });
            if (dispatchError) {
              console.error("dispatch_ride_request", dispatchError);
              toast.error("Impossible de contacter les chauffeurs — réessayez");
            } else {
              setSearchingDrivers(Number(count) || 0);
              if (!count) toast.info("Aucun chauffeur en ligne à moins de 2 km — recherche élargie");
              // Sonnerie sur les téléphones des chauffeurs, même app fermée
              try {
                await notifyDrivers({ data: { requestId: req.id } });
              } catch (e) {
                console.error("notifyNearbyDrivers", e);
              }
            }
          }
        } catch (e) {
          console.error("ride_requests", e);
          toast.error("Envoi de la demande indisponible — course enregistrée localement");
        }

      }
      toast.success("Course confirmée — un chauffeur arrive !");
    } finally { setBooking(false); }
  };


  const reset = () => {
    setConfirmed(null); setTo(""); setDistance(""); setDuration(""); setPromo(""); setRoutePolyline(null);
  };

  if (confirmed) {
    return (
      <div className="fixed inset-0 z-40 bg-background flex flex-col">
        {/* Carte plein écran, colorée et lisible */}
        <div className="relative flex-1 min-h-0">
          <MapView
            drivers={liveDrivers}
            me={position ? { lat: position.lat, lng: position.lng } : null}
            routePolyline={liveRoute.polyline ?? confirmed.routePolyline}
            className="h-full w-full"
            theme="vivid"
          />
          <div className="absolute top-3 left-3 right-3 rounded-2xl bg-background/90 backdrop-blur px-4 py-2.5 shadow-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight">Course confirmée 🚖</p>
              <p className="text-[11px] text-muted-foreground truncate">Vers {to}</p>
            </div>
          </div>
          <div className="absolute bottom-3 left-3 right-3 rounded-2xl border-2 border-primary bg-background/95 backdrop-blur px-4 py-3 shadow-lg flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight">
                {etaMin === null
                  ? "Recherche du taxi le plus proche…"
                  : etaMin <= 1
                    ? "Votre taxi est arrivé 🚖"
                    : `Votre taxi arrive dans ${etaMin} min`}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {requestId && searchingDrivers > 0
                  ? `${searchingDrivers} chauffeur(s) sonnent — le premier qui accepte vient vous chercher`
                  : "Suivez le marqueur taxi jaune animé sur la carte"}
              </p>
            </div>
          </div>
        </div>



        {/* Fiche chauffeur en bas d'écran */}
        <div className="max-h-[62vh] overflow-y-auto border-t bg-background p-3 space-y-3 pb-6">
          {confirmedRide && <RideProgress ride={confirmedRide} remaining={liveRoute.info} />}

          <DriverInfoCard
            name={confirmed.driverName}
            phone={confirmed.driverPhone}
            plate={confirmed.plate}
            vehicle={confirmed.vehicle}
            rating={confirmed.rating}
            etaMin={etaMin}
          />

          <div className="rounded-2xl bg-primary/10 border-2 border-primary p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Code PIN de départ</p>
            <p className="text-4xl font-black tracking-[0.4em] text-primary">{confirmed.startPin}</p>
            <p className="text-xs text-muted-foreground mt-1">Communiquez ce code au chauffeur à son arrivée</p>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total à payer en liquide</span>
            <span className="font-bold text-lg text-primary">{confirmed.total} XAF</span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={reset}>Nouvelle course</Button>
            <Link to="/historique" className="flex-1"><Button className="w-full">Voir l'historique</Button></Link>
          </div>
        </div>
      </div>

    );
  }

  return (
    <div className="relative h-full min-h-[100dvh] overflow-hidden bg-secondary text-secondary-foreground">
      <MapView
        drivers={liveDrivers}
        me={position ? { lat: position.lat, lng: position.lng } : null}
        routePolyline={routePolyline}
        className="absolute inset-0 h-full w-full"
        theme="vivid"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-secondary/55 via-transparent to-secondary/75" />

      <section className="absolute inset-x-0 bottom-0 z-20 max-h-[77dvh] overflow-y-auto rounded-t-[28px] border-t border-secondary-foreground/10 bg-secondary/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl backdrop-blur-xl md:bottom-5 md:left-5 md:right-auto md:top-20 md:max-h-[calc(100dvh-6.25rem)] md:w-[420px] md:rounded-2xl md:border">
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-secondary-foreground/20 md:hidden" />
        <div className="mb-5">
          <p className="text-[11px] font-bold uppercase text-primary">Votre trajet</p>
          <h1 className="mt-1 text-2xl font-bold">Où allez-vous ?</h1>
        </div>

        <div className="relative rounded-2xl border border-secondary-foreground/10 bg-secondary-foreground/5 p-4">
          <div className="absolute bottom-8 left-[25px] top-8 w-px bg-gradient-to-b from-primary to-chart-2" />
          <div className="relative flex items-center gap-3 border-b border-secondary-foreground/10 pb-3">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-primary bg-secondary"><span className="h-1.5 w-1.5 rounded-full bg-primary" /></span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase text-secondary-foreground/45">Départ</p>
              <p className="truncate text-sm font-semibold">{position ? "Votre position actuelle" : "Localisation en cours…"}</p>
            </div>
            <Locate className={`ml-auto h-4 w-4 shrink-0 ${position ? "text-chart-2" : "animate-pulse text-secondary-foreground/40"}`} />
          </div>
          <div className="relative flex items-center gap-3 pt-3">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-[5px] border-2 border-chart-2 bg-secondary"><span className="h-1.5 w-1.5 rounded-[2px] bg-chart-2" /></span>
            <div className="min-w-0 flex-1">
              <p className="mb-0.5 text-[10px] font-bold uppercase text-secondary-foreground/45">Destination</p>
              <DestinationInput
                value={to}
                onChange={setTo}
                position={position ? { lat: position.lat, lng: position.lng } : null}
                placeholder="Saisissez un lieu"
                inputClassName="h-7 border-0 bg-transparent p-0 pl-0 text-sm font-semibold text-secondary-foreground shadow-none placeholder:text-secondary-foreground/35 focus-visible:ring-0"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 min-h-5 px-1 text-xs text-secondary-foreground/55">
          {!position ? geoError ? <span className="text-destructive">Activez la localisation pour continuer</span> : "Recherche de votre position…" : estimating ? (
            <span className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Calcul du meilleur trajet…</span>
          ) : estimateError ? <span className="text-destructive">{estimateError}</span> : distance && duration ? (
            <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-chart-2" /> {distance} km · {duration} min · {liveDrivers.length} chauffeur(s) autour</span>
          ) : "Entrez votre destination pour voir les options"}
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase text-secondary-foreground/55">Choisissez votre course</h2>
            {distance && duration && <span className="text-xs font-semibold text-chart-2">Prix garanti</span>}
          </div>
          <div className="space-y-2">
            {classes.map((c) => {
              const Icon = c.icon;
              const active = vehicleClass === c.id;
              const count = drivers.filter((d) => !d.blocked && d.vehicleClass === c.id).length;
              const rule = pricingRules?.[vehicleClassToCategory(c.id)] ?? null;
              const optionFare = rule && distKm && durMin ? Math.ceil(computeDynamicFare(distKm, durMin, rule) / 50) * 50 : null;
              return (
                <Button
                  key={c.id}
                  type="button"
                  variant="ghost"
                  onClick={() => setVehicleClass(c.id)}
                  className={`h-[68px] w-full justify-start rounded-xl border px-3 text-left ${active ? "border-primary bg-primary/10 hover:bg-primary/15" : "border-secondary-foreground/10 bg-secondary-foreground/[0.04] hover:bg-secondary-foreground/[0.08]"}`}
                >
                  <span className={`grid h-11 w-14 shrink-0 place-items-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-secondary-foreground/10 text-secondary-foreground"}`}><Icon className="h-6 w-6" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 font-bold text-secondary-foreground">{c.label}{active && <Sparkles className="h-3.5 w-3.5 text-primary" />}</span>
                    <span className="block truncate text-[11px] font-normal text-secondary-foreground/50">{c.sub} · {count} disponible{count > 1 ? "s" : ""}</span>
                  </span>
                  <span className="shrink-0 text-right font-bold text-secondary-foreground">{optionFare ? `${optionFare.toLocaleString("fr-FR")} XAF` : "—"}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-secondary-foreground/10 bg-secondary-foreground/[0.04] px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold"><Banknote className="h-4 w-4 text-primary" /> Paiement en liquide</div>
          <div className="flex items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-secondary-foreground/45" />
            <Input value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} placeholder="Code promo" className="h-7 w-24 border-0 bg-transparent p-0 text-right text-xs text-secondary-foreground shadow-none focus-visible:ring-0" />
          </div>
        </div>
        {promo && <p className={`mt-1 px-1 text-[11px] ${promoResult.ok ? "text-chart-2" : "text-destructive"}`}>{promoResult.msg}</p>}

        {!user && (
          <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
            <p className="mb-2 text-xs font-semibold text-primary">Première course sans compte</p>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="sr-only">Nom</Label><Input value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} placeholder="Votre nom" className="border-secondary-foreground/10 bg-secondary-foreground/5 text-secondary-foreground placeholder:text-secondary-foreground/35" /></div>
              <div><Label className="sr-only">Téléphone</Label><Input value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} placeholder="6XX XXX XXX" className="border-secondary-foreground/10 bg-secondary-foreground/5 text-secondary-foreground placeholder:text-secondary-foreground/35" /></div>
            </div>
          </div>
        )}

        <Button
          className="mt-4 h-14 w-full rounded-xl text-base font-extrabold shadow-lg transition-transform active:scale-[0.98]"
          size="lg"
          onClick={handleBook}
          disabled={!to || !distance || !duration || estimating || booking || !position || !pricingRules || finalTotal === 0}
        >
          {booking ? <><Loader2 className="animate-spin" /> Recherche du chauffeur…</> : estimating ? "Calcul du prix…" : !position ? "Localisation…" : finalTotal ? `Commander · ${finalTotal.toLocaleString("fr-FR")} XAF` : "Choisir une destination"}
        </Button>
        {user && profile && <p className="mt-2 text-center text-[11px] text-secondary-foreground/45">Course pour {profile.name}{profile.phone ? ` · ${profile.phone}` : ""}</p>}
      </section>
    </div>
  );
}
