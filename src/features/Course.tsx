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
import { Car, Crown, Bike, Tag, Loader2, MapPin, Navigation, Phone, ShieldCheck, LogIn, Locate, ChevronLeft } from "lucide-react";

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
  const [expanded, setExpanded] = useState(false);
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
    setConfirmed(null); setExpanded(false); setTo(""); setDistance(""); setDuration(""); setPromo(""); setRoutePolyline(null);
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

  const destinationCard = (
      <Card>
        <CardHeader><CardTitle className="text-base">1. Votre destination</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Navigation className="h-3 w-3 text-primary" /> Où allez-vous ?</Label>
            <DestinationInput
              value={to}
              onChange={setTo}
              onSelect={() => setExpanded(true)}
              position={position ? { lat: position.lat, lng: position.lng } : null}
            />
          </div>
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            {!position ? (
              <span className="text-muted-foreground">En attente de votre position GPS…</span>
            ) : estimating ? (
              <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Calcul de l'itinéraire…</span>
            ) : estimateError ? (
              <span className="text-destructive">{estimateError}</span>
            ) : distance && duration ? (
              <span>📍 <b>{distance} km</b> · ⏱ <b>{duration} min</b> depuis votre position</span>
            ) : (
              <span className="text-muted-foreground">Saisissez votre destination…</span>
            )}
          </div>
        </CardContent>
      </Card>
  );

  const bookingSteps = (
    <>
      {/* Étape 2 : catégorie */}
      <Card>
        <CardHeader><CardTitle className="text-base">2. Type de véhicule</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {classes.map((c) => {
              const Icon = c.icon;
              const active = vehicleClass === c.id;
              const count = drivers.filter((d) => !d.blocked && d.vehicleClass === c.id).length;
              return (
                <button
                  key={c.id} type="button" onClick={() => setVehicleClass(c.id)}
                  className={`text-left rounded-2xl p-3 border-2 transition ${
                    active ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <Icon className="h-5 w-5 mb-2" />
                  <p className="font-bold text-sm">{c.label}</p>
                  <p className="text-[10px] text-muted-foreground">{c.sub}</p>
                  <p className="text-[10px] text-primary mt-1">{count} dispo</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Étape 3 : promo + récap */}
      <Card>
        <CardHeader><CardTitle className="text-base">3. Récapitulatif</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-xs"><Tag className="h-3 w-3" /> Code promo (optionnel)</Label>
            <Input value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} placeholder="BIENVENUE" />
            {promo && (
              <p className={`text-xs ${promoResult.ok ? "text-green-600" : "text-destructive"}`}>{promoResult.msg}</p>
            )}
          </div>
          <div className="border-t pt-3 space-y-2">
            {distance && duration && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-muted/40 p-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Distance</p>
                  <p className="font-semibold">{distance} km</p>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Durée</p>
                  <p className="font-semibold">{duration} min</p>
                </div>
              </div>
            )}
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Prix total</span>
              <span className="text-3xl font-bold text-primary">
                {pricingError ? "—" : !pricingRules ? "…" : distance && duration ? finalTotal : "—"} XAF
              </span>
            </div>
            {distance && duration && pricingRules && (
              <p className="text-[11px] text-green-600 font-medium">
                ✓ Prix fixe garanti, aucune surprise à l'arrivée
              </p>
            )}
            {pricingError && (
              <p className="text-[11px] text-destructive">Tarifs indisponibles — réessayez plus tard</p>
            )}
            <Badge variant="outline" className="mt-1"><MapPin className="h-3 w-3 mr-1" /> 💵 Paiement en liquide au chauffeur</Badge>
          </div>
          {!user && (
            <div className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-3 space-y-2">
              <p className="text-xs font-semibold">Commande sans compte · 1 course offerte 🎁</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Nom *</Label>
                  <Input value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} placeholder="Jean" />
                </div>
                <div>
                  <Label className="text-xs">Téléphone *</Label>
                  <Input value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} placeholder="6XX XXX XXX" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Le chauffeur vous appelle sur ce numéro. <Link to="/auth" className="text-primary underline">Créer un compte</Link> pour commander sans limite.
              </p>
            </div>
          )}
          <Button
            className="w-full" size="lg" onClick={handleBook}
            disabled={!to || !distance || !duration || estimating || booking || !position || !pricingRules || finalTotal === 0}
          >
            {booking ? "Réservation…" : estimating ? "Calcul en cours…" : !position ? "Localisation…" : `Commander — ${finalTotal} XAF`}
          </Button>
          {user && profile && (
            <p className="text-[11px] text-muted-foreground text-center">
              Réservé au nom de <b>{profile.name}</b>{profile.phone ? ` · ${profile.phone}` : ""}
            </p>
          )}

        </CardContent>
      </Card>
    </>
  );

  // Dès qu'une destination est choisie : carte plein écran, colorée et lisible
  if (expanded) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-background">
        <div className="relative flex-1 min-h-0">
          <MapView
            drivers={liveDrivers}
            me={position ? { lat: position.lat, lng: position.lng } : null}
            routePolyline={routePolyline}
            className="h-full w-full"
            theme="vivid"
          />
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Revenir à la saisie"
            className="absolute top-3 left-3 h-10 w-10 rounded-full bg-background/90 backdrop-blur shadow-lg flex items-center justify-center"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="absolute top-3 left-16 right-3 rounded-2xl bg-background/90 backdrop-blur px-4 py-2.5 shadow-lg">
            <p className="text-sm font-semibold truncate flex items-center gap-1">
              <Navigation className="h-3.5 w-3.5 text-primary" /> {to}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {estimating
                ? "Calcul de l'itinéraire…"
                : distance && duration
                  ? `${distance} km · ${duration} min depuis votre position`
                  : estimateError ?? "En attente de l'itinéraire"}
            </p>
          </div>
        </div>
        <div className="max-h-[58vh] overflow-y-auto border-t p-3 space-y-3 pb-6">{bookingSteps}</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Où allez-vous ?</h1>
        <p className="text-muted-foreground">Nous vous localisons — indiquez juste la destination</p>
      </div>

      {/* Carte en direct */}
      <MapView
        drivers={liveDrivers}
        me={position ? { lat: position.lat, lng: position.lng } : null}
        routePolyline={routePolyline}
        className="h-56"
        theme="vivid"
      />

      {/* Statut GPS */}
      <div className="rounded-lg border bg-muted/40 p-3 text-sm flex items-center gap-2">
        <Locate className={`h-4 w-4 ${position ? "text-green-500" : "text-muted-foreground animate-pulse"}`} />
        {position ? (
          <span className="text-muted-foreground">📍 Position détectée — {liveDrivers.length} chauffeur(s) en ligne autour de vous</span>
        ) : geoError ? (
          <span className="text-destructive">Activez la géolocalisation pour continuer ({geoError})</span>
        ) : (
          <span className="text-muted-foreground">Localisation en cours…</span>
        )}
      </div>

      {destinationCard}
      {bookingSteps}
    </div>
  );
}
