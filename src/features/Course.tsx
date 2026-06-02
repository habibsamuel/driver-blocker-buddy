import { useMemo, useState } from "react";
import { useStore, computeFare } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function Course() {
  const { drivers, clients, settings, addRide } = useStore();
  const [driverId, setDriverId] = useState("");
  const [clientId, setClientId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [distance, setDistance] = useState("3");
  const [duration, setDuration] = useState("8");
  const [wait, setWait] = useState("0");
  const [hour, setHour] = useState(String(new Date().getHours()));

  const available = drivers.filter((d) => !d.blocked);

  // ✅ Calculate fare WITH all parameters included
  const fare = useMemo(
    () =>
      computeFare(
        parseFloat(distance) || 0,
        parseFloat(duration) || 0,
        parseFloat(wait) || 0,
        parseInt(hour) || 0,
        settings,
      ),
    [distance, duration, wait, hour, settings],
  );

  const handleSubmit = () => {
    if (!driverId || !clientId || !from || !to) {
      toast.error("Tous les champs sont obligatoires");
      return;
    }
    
    // ✅ Validate distance & duration are positive
    const dist = parseFloat(distance);
    const dur = parseFloat(duration);
    if (dist <= 0 || dur <= 0) {
      toast.error("Distance et durée doivent être > 0");
      return;
    }

    const ride = addRide({
      driverId,
      clientId,
      from,
      to,
      distanceKm: dist,
      durationMin: dur,
      waitMin: parseFloat(wait) || 0,
      baseFare: fare.baseFare,
      timeSurcharge: fare.timeSurcharge,
      waitSurcharge: fare.waitSurcharge,
      peakMultiplier: fare.peakMultiplier,
      total: fare.total,
    });
    
    if (!ride) {
      toast.error("Chauffeur indisponible ou bloqué");
      return;
    }
    
    toast.success(`Course lancée — ${fare.total} XAF à percevoir`);
    setFrom("");
    setTo("");
    setDistance("3");
    setDuration("8");
    setWait("0");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lancer une course</h1>
        <p className="text-muted-foreground">
          ✅ Calcul automatique du tarif (distance + durée + attente + horaire)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Détails de la course</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Chauffeur disponible</Label>
              <Select value={driverId} onValueChange={setDriverId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un chauffeur" /></SelectTrigger>
                <SelectContent>
                  {available.length === 0 && <div className="p-2 text-sm text-muted-foreground">Aucun chauffeur disponible</div>}
                  {available.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name} — {d.zone}</SelectItem>
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
              <div className="space-y-2">
                <Label>Distance (km) *</Label>
                <Input 
                  type="number" 
                  value={distance} 
                  onChange={(e)=>setDistance(e.target.value)}
                  placeholder="0.5"
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="space-y-2">
                <Label>Durée (min) *</Label>
                <Input 
                  type="number" 
                  value={duration} 
                  onChange={(e)=>setDuration(e.target.value)}
                  placeholder="5"
                  min="0"
                  step="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Attente (min)</Label>
                <Input 
                  type="number" 
                  value={wait} 
                  onChange={(e)=>setWait(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Heure (0-23)</Label>
                <Input 
                  type="number" 
                  value={hour} 
                  onChange={(e)=>setHour(e.target.value)}
                  min="0"
                  max="23"
                  step="1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Calcul du tarif</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Row label={`Tarif kilométrique (${distance} km × ${settings.pricePerKm} XAF)`} value={fare.baseFare} />
            <Row label={`Majoration temps (${duration} min × ${settings.pricePerMin} XAF)`} value={fare.timeSurcharge} />
            <Row label={`Attente (${wait} min)`} value={fare.waitSurcharge} />
            <Row 
              label={`Multiplicateur horaire (${hour}h)`} 
              value={`×${fare.peakMultiplier.toFixed(2)}${getHourType(parseInt(hour))}`}
            />
            <div className="border-t pt-3 mt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-semibold">TOTAL</span>
                <span className="text-3xl font-bold text-primary">{fare.total} XAF</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Min {settings.minFare} · Max {settings.maxFare} XAF · Paiement post-course
              </p>
            </div>
            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleSubmit}
              disabled={!driverId || !clientId || !from || !to}
            >
              Lancer la course
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

// ✅ Helper to show peak/night times
function getHourType(hour: number): string {
  if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)) return " (heures de pointe)";
  if (hour >= 22 || hour < 6) return " (nuit)";
  return " (normal)";
}
