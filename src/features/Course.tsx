import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useStore, computeFare, type VehicleClass } from "@/lib/store";
import { estimateRoute } from "@/lib/route.functions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Car, Crown, Bike, Tag, Loader2, MapPin, Navigation, Phone, ShieldCheck, LogIn } from "lucide-react";

const classes: { id: VehicleClass; label: string; sub: string; icon: any }[] = [
  { id: "moto", label: "Bend-Skin", sub: "Moto-taxi · le plus rapide", icon: Bike },
  { id: "eco", label: "Éco", sub: "Voiture standard", icon: Car },
  { id: "confort", label: "Confort", sub: "Berline climatisée", icon: Crown },
];

export function Course() {
  const { drivers, settings, addRide, applyPromo, addClient, clients } = useStore();
  const { user } = useAuth();
  const estimate = useServerFn(estimateRoute);

  // Profil client (auto depuis compte connecté)
  const [profile, setProfile] = useState<{ name: string; phone: string; quartier: string } | null>(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>("eco");
  const [promo, setPromo] = useState("");
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState<null | {
    rideId: string; startPin: string; driverName: string; driverPhone: string;
    plate?: string; vehicle?: string; total: number;
  }>(null);

  // Charger profil depuis Supabase
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name, phone, quartier").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) setProfile({ name: data.name || "Client", phone: data.phone || "", quartier: data.quartier || "" });
        else setProfile({ name: user.email?.split("@")[0] || "Client", phone: "", quartier: "" });
      });
  }, [user]);

  // Auto-estimation
  useEffect(() => {
    const f = from.trim(), t = to.trim();
    if (f.length < 2 || t.length < 2) { setDistance(""); setDuration(""); setEstimateError(null); return; }
    const ctrl = new AbortController();
    setEstimating(true); setEstimateError(null);
    const timer = setTimeout(async () => {
      try {
        const r = await estimate({ data: { from: f, to: t } });
        if (ctrl.signal.aborted) return;
        setDistance(String(r.distanceKm)); setDuration(String(r.durationMin));
      } catch {
        if (ctrl.signal.aborted) return;
        setEstimateError("Itinéraire introuvable — vérifiez les adresses");
        setDistance(""); setDuration("");
      } finally { if (!ctrl.signal.aborted) setEstimating(false); }
    }, 600);
    return () => { ctrl.abort(); clearTimeout(timer); };
  }, [from, to, estimate]);

  const hour = new Date().getHours();
  const available = useMemo(
    () => drivers.filter((d) => !d.blocked && d.vehicleClass === vehicleClass).sort((a, b) => b.rating - a.rating),
    [drivers, vehicleClass],
  );

  const fare = useMemo(
    () => computeFare(parseFloat(distance) || 0, parseFloat(duration) || 0, 0, hour, settings, vehicleClass),
    [distance, duration, hour, settings, vehicleClass],
  );

  const promoResult = useMemo(
    () => (promo.trim() ? applyPromo(promo, fare.total) : { ok: false, discount: 0, msg: "" }),
    [promo, fare.total, applyPromo],
  );
  const finalTotal = Math.max(settings.minFare, fare.total - (promoResult.ok ? promoResult.discount : 0));

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LogIn className="h-5 w-5 text-primary" /> Connexion requise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pour réserver une course, connectez-vous à votre compte. Nous utilisons vos informations de profil automatiquement.
            </p>
            <Link to="/auth"><Button className="w-full">Se connecter / S'inscrire</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleBook = async () => {
    if (!from.trim() || !to.trim()) { toast.error("Indiquez départ et arrivée"); return; }
    const dist = parseFloat(distance), dur = parseFloat(duration);
    if (!dist || !dur) { toast.error("Itinéraire non calculé"); return; }
    if (available.length === 0) { toast.error("Aucun chauffeur disponible dans cette catégorie"); return; }

    setBooking(true);
    try {
      // Trouver/créer le client local lié au compte
      const name = profile?.name || "Client";
      const phone = profile?.phone || "";
      let client = clients.find((c) => c.phone && phone && c.phone === phone);
      if (!client) client = addClient({ name, phone, quartier: profile?.quartier || "" });

      // Attribution automatique : meilleur chauffeur disponible
      const driver = available[0];

      const ride = addRide({
        driverId: driver.id, clientId: client.id, from: from.trim(), to: to.trim(),
        distanceKm: dist, durationMin: dur, waitMin: 0,
        baseFare: fare.baseFare, timeSurcharge: fare.timeSurcharge, waitSurcharge: fare.waitSurcharge,
        peakMultiplier: fare.peakMultiplier, vehicleClass, classMultiplier: fare.classMultiplier,
        promoCode: promoResult.ok ? promo.trim().toUpperCase() : undefined,
        promoDiscount: promoResult.ok ? promoResult.discount : undefined,
        total: finalTotal,
      });
      if (!ride) { toast.error("Chauffeur indisponible"); return; }

      setConfirmed({
        rideId: ride.id, startPin: ride.startPin,
        driverName: driver.name, driverPhone: driver.phone,
        plate: driver.plate, vehicle: driver.vehicle, total: finalTotal,
      });
      toast.success("Course confirmée — un chauffeur arrive !");
    } finally { setBooking(false); }
  };

  const reset = () => {
    setConfirmed(null); setFrom(""); setTo(""); setDistance(""); setDuration(""); setPromo("");
  };

  if (confirmed) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex h-16 w-16 rounded-full bg-primary/20 items-center justify-center mb-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Course confirmée 🚖</h1>
          <p className="text-muted-foreground text-sm">Votre chauffeur est en route</p>
        </div>
        <Card>
          <CardHeader><CardTitle>Votre chauffeur</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">{confirmed.driverName}</p>
                <p className="text-sm text-muted-foreground">{confirmed.vehicle} · {confirmed.plate}</p>
              </div>
              <a href={`tel:${confirmed.driverPhone}`}>
                <Button size="sm" variant="outline"><Phone className="h-4 w-4 mr-1" /> Appeler</Button>
              </a>
            </div>
            <div className="rounded-lg bg-primary/10 border-2 border-primary p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Code PIN de départ</p>
              <p className="text-4xl font-black tracking-[0.4em] text-primary">{confirmed.startPin}</p>
              <p className="text-xs text-muted-foreground mt-1">Communiquez ce code au chauffeur à son arrivée</p>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">Total à payer en liquide</span>
              <span className="font-bold text-lg text-primary">{confirmed.total} XAF</span>
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={reset}>Nouvelle course</Button>
          <Link to="/historique" className="flex-1"><Button className="w-full">Voir l'historique</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Où allez-vous ?</h1>
        <p className="text-muted-foreground">Indiquez votre trajet, nous trouvons le meilleur chauffeur</p>
      </div>

      {/* Étape 1 : trajet */}
      <Card>
        <CardHeader><CardTitle className="text-base">1. Votre trajet</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><MapPin className="h-3 w-3 text-primary" /> Lieu de départ</Label>
            <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Ex: Bastos, Yaoundé" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Navigation className="h-3 w-3 text-primary" /> Destination</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Ex: Aéroport Nsimalen" />
          </div>
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            {estimating ? (
              <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Calcul de l'itinéraire…</span>
            ) : estimateError ? (
              <span className="text-destructive">{estimateError}</span>
            ) : distance && duration ? (
              <span>📍 <b>{distance} km</b> · ⏱ <b>{duration} min</b></span>
            ) : (
              <span className="text-muted-foreground">Saisissez le départ et l'arrivée…</span>
            )}
          </div>
        </CardContent>
      </Card>

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
          <div className="border-t pt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Total estimé</span>
              <span className="text-3xl font-bold text-primary">{distance && duration ? finalTotal : "—"} XAF</span>
            </div>
            <Badge variant="outline" className="mt-2">💵 Paiement en liquide au chauffeur</Badge>
          </div>
          <Button
            className="w-full" size="lg" onClick={handleBook}
            disabled={!from || !to || !distance || !duration || estimating || booking}
          >
            {booking ? "Réservation…" : estimating ? "Calcul en cours…" : `Commander — ${finalTotal} XAF`}
          </Button>
          {profile && (
            <p className="text-[11px] text-muted-foreground text-center">
              Réservé au nom de <b>{profile.name}</b>{profile.phone ? ` · ${profile.phone}` : ""}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
