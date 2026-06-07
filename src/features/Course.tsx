import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useStore, computeFare, type VehicleClass } from "@/lib/store";
import { estimateRoute } from "@/lib/route.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Car, Crown, Bike, Tag, Loader2 } from "lucide-react";

const classes: { id: VehicleClass; label: string; sub: string; icon: any }[] = [
  { id: "moto", label: "Bend-Skin", sub: "Moto-taxi · le plus rapide", icon: Bike },
  { id: "eco", label: "Éco", sub: "Voiture standard · prix juste", icon: Car },
  { id: "confort", label: "Confort", sub: "Berline climatisée", icon: Crown },
];

export function Course() {
  const { drivers, clients, settings, addRide, applyPromo } = useStore();
  const estimate = useServerFn(estimateRoute);
  const [driverId, setDriverId] = useState("");
  const [clientId, setClientId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [wait, setWait] = useState("0");
  const [hour, setHour] = useState(String(new Date().getHours()));
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>("eco");
  const [promo, setPromo] = useState("");
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  // Auto-estimation distance/durée via Google Maps quand départ & arrivée sont saisis
  useEffect(() => {
    const f = from.trim();
    const t = to.trim();
    if (f.length < 2 || t.length < 2) {
      setDistance(""); setDuration(""); setEstimateError(null);
      return;
    }
    const ctrl = new AbortController();
    setEstimating(true); setEstimateError(null);
    const timer = setTimeout(async () => {
      try {
        const r = await estimate({ data: { from: f, to: t } });
        if (ctrl.signal.aborted) return;
        setDistance(String(r.distanceKm));
        setDuration(String(r.durationMin));
      } catch (e: any) {
        if (ctrl.signal.aborted) return;
        setEstimateError("Itinéraire introuvable — vérifiez les adresses");
        setDistance(""); setDuration("");
      } finally {
        if (!ctrl.signal.aborted) setEstimating(false);
      }
    }, 600);
    return () => { ctrl.abort(); clearTimeout(timer); };
  }, [from, to, estimate]);

  const available = drivers.filter((d) => !d.blocked && d.vehicleClass === vehicleClass);

  const fare = useMemo(
    () => computeFare(
      parseFloat(distance) || 0,
      parseFloat(duration) || 0,
      parseFloat(wait) || 0,
      parseInt(hour) || 0,
      settings,
      vehicleClass,
    ),
    [distance, duration, wait, hour, settings, vehicleClass],
  );

  const promoResult = useMemo(
    () => (promo.trim() ? applyPromo(promo, fare.total) : { ok: false, discount: 0, msg: "" }),
    [promo, fare.total, applyPromo],
  );
  const finalTotal = Math.max(settings.minFare, fare.total - (promoResult.ok ? promoResult.discount : 0));

  const handleSubmit = () => {
    if (!driverId || !clientId || !from || !to) {
      toast.error("Tous les champs sont obligatoires");
      return;
    }
    const dist = parseFloat(distance);
    const dur = parseFloat(duration);
    if (dist <= 0 || dur <= 0) {
      toast.error("Distance et durée doivent être > 0");
      return;
    }
    const ride = addRide({
      driverId, clientId, from, to,
      distanceKm: dist, durationMin: dur,
      waitMin: parseFloat(wait) || 0,
      baseFare: fare.baseFare,
      timeSurcharge: fare.timeSurcharge,
      waitSurcharge: fare.waitSurcharge,
      peakMultiplier: fare.peakMultiplier,
      vehicleClass,
      classMultiplier: fare.classMultiplier,
      promoCode: promoResult.ok ? promo.trim().toUpperCase() : undefined,
      promoDiscount: promoResult.ok ? promoResult.discount : undefined,
      total: finalTotal,
    });
    if (!ride) { toast.error("Chauffeur indisponible ou bloqué"); return; }
    toast.success(`Course réservée — ${finalTotal} XAF · PIN départ: ${ride.startPin}`, {
      duration: 10000,
      description: "Communiquez ce PIN au chauffeur pour démarrer.",
    });
    setFrom(""); setTo(""); setDistance(""); setDuration(""); setWait(""); setPromo("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Réserver une course</h1>
        <p className="text-muted-foreground">Estimation auto · classes de service · code PIN de départ</p>
      </div>

      {/* Class picker (Yango style) */}
      <div className="grid grid-cols-3 gap-2">
        {classes.map((c) => {
          const Icon = c.icon;
          const active = vehicleClass === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => { setVehicleClass(c.id); setDriverId(""); }}
              className={`text-left rounded-2xl p-3 border-2 transition ${
                active ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <Icon className="h-5 w-5 mb-2" />
              <p className="font-bold text-sm">{c.label}</p>
              <p className="text-[10px] text-muted-foreground">{c.sub}</p>
              <p className="text-xs font-bold mt-1">
                ×{settings.classMultipliers[c.id].toFixed(2)}
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Détails de la course</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Chauffeur disponible ({available.length})</Label>
              <Select value={driverId} onValueChange={setDriverId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un chauffeur" /></SelectTrigger>
                <SelectContent>
                  {available.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground">Aucun chauffeur {vehicleClass}</div>
                  )}
                  {available.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} — {d.zone} {d.rating > 0 ? `· ⭐${d.rating}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                <SelectContent>
                  {clients.length === 0 && <div className="p-2 text-sm text-muted-foreground">Aucun client</div>}
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} — {c.quartier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Départ</Label><Input value={from} onChange={(e)=>setFrom(e.target.value)} placeholder="Bastos" /></div>
              <div className="space-y-2"><Label>Arrivée</Label><Input value={to} onChange={(e)=>setTo(e.target.value)} placeholder="Mvan" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Distance (km) *</Label><Input type="number" value={distance} onChange={(e)=>setDistance(e.target.value)} min="0" step="0.1" /></div>
              <div className="space-y-2"><Label>Durée (min) *</Label><Input type="number" value={duration} onChange={(e)=>setDuration(e.target.value)} min="0" step="1" /></div>
              <div className="space-y-2"><Label>Attente (min)</Label><Input type="number" value={wait} onChange={(e)=>setWait(e.target.value)} min="0" step="1" /></div>
              <div className="space-y-2"><Label>Heure (0-23)</Label><Input type="number" value={hour} onChange={(e)=>setHour(e.target.value)} min="0" max="23" step="1" /></div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Tag className="h-3 w-3" /> Code promo (optionnel)</Label>
              <Input value={promo} onChange={(e)=>setPromo(e.target.value.toUpperCase())} placeholder="BIENVENUE" />
              {promo && (
                <p className={`text-xs ${promoResult.ok ? "text-green-600" : "text-destructive"}`}>
                  {promoResult.msg}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Estimation du tarif</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Row label={`Kilométrage (${distance} km × ${settings.pricePerKm} XAF)`} value={fare.baseFare} />
            <Row label={`Temps (${duration} min × ${settings.pricePerMin} XAF)`} value={fare.timeSurcharge} />
            <Row label={`Attente (${wait || 0} min)`} value={fare.waitSurcharge} />
            <Row label={`Multiplicateur horaire (${hour}h)`} value={`×${fare.peakMultiplier.toFixed(2)}${getHourType(parseInt(hour))}`} />
            <Row label={`Catégorie (${vehicleClass})`} value={`×${fare.classMultiplier.toFixed(2)}`} />
            {promoResult.ok && (
              <Row label={`Code promo ${promo.toUpperCase()}`} value={`-${promoResult.discount} XAF`} />
            )}
            <div className="border-t pt-3 mt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-semibold">TOTAL</span>
                <span className="text-3xl font-bold text-primary">{finalTotal} XAF</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Min {settings.minFare} · Max {settings.maxFare} XAF · 💵 Paiement en liquide après la course
              </p>
              <Badge variant="outline" className="mt-2">Paiement cash uniquement</Badge>
            </div>
            <Button className="w-full" size="lg" onClick={handleSubmit} disabled={!driverId || !clientId || !from || !to}>
              Réserver — {finalTotal} XAF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{typeof value === "number" ? `${value} XAF` : value}</span>
    </div>
  );
}

function getHourType(hour: number): string {
  if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)) return " (pointe)";
  if (hour >= 22 || hour < 6) return " (nuit)";
  return " (normal)";
}
