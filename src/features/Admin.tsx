import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export function Admin() {
  const { settings, updateSettings, drivers, codes, resetMonthlyCounters, checkAndBlockDrivers, role } = useStore();
  const blocked = drivers.filter((d) => d.blocked);

  if (role !== "admin") {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-3">
        <div className="text-6xl">🔒</div>
        <h1 className="text-2xl font-bold">Accès restreint</h1>
        <p className="text-muted-foreground">
          L'interface d'administration est réservée aux administrateurs.
        </p>
      </div>
    );
  }

  const handleNum = (k: keyof typeof settings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    updateSettings({ [k]: parseFloat(e.target.value) || 0 } as any);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        <p className="text-muted-foreground">Règles métier & paramètres</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Tarification</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div><Label>Prix / km (XAF)</Label><Input type="number" value={settings.pricePerKm} onChange={handleNum("pricePerKm")} /></div>
            <div><Label>Prix / min (XAF)</Label><Input type="number" value={settings.pricePerMin} onChange={handleNum("pricePerMin")} /></div>
            <div><Label>Tarif min</Label><Input type="number" value={settings.minFare} onChange={handleNum("minFare")} /></div>
            <div><Label>Tarif max</Label><Input type="number" value={settings.maxFare} onChange={handleNum("maxFare")} /></div>
            <div><Label>Attente / 5min</Label><Input type="number" value={settings.waitSurchargePer5min} onChange={handleNum("waitSurchargePer5min")} /></div>
            <div><Label>Pointe %</Label><Input type="number" step="0.01" value={settings.peakHourPct} onChange={handleNum("peakHourPct")} /></div>
            <div><Label>Nuit %</Label><Input type="number" step="0.01" value={settings.nightPct} onChange={handleNum("nightPct")} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Système d'abonnement</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div><Label>Palier 1 (clients)</Label><Input type="number" value={settings.threshold1} onChange={handleNum("threshold1")} /></div>
            <div><Label>Palier 1 (XAF)</Label><Input type="number" value={settings.subscription1} onChange={handleNum("subscription1")} /></div>
            <div><Label>Palier 2 (clients)</Label><Input type="number" value={settings.threshold2} onChange={handleNum("threshold2")} /></div>
            <div><Label>Palier 2 (XAF)</Label><Input type="number" value={settings.subscription2} onChange={handleNum("subscription2")} /></div>
            <div><Label>Délai blocage (h)</Label><Input type="number" value={settings.graceHours} onChange={handleNum("graceHours")} /></div>
            <div><Label>N° paiement</Label><Input value={settings.paymentNumber} onChange={(e)=>updateSettings({paymentNumber:e.target.value})} /></div>
            <div className="col-span-2 flex gap-2 pt-2">
              <Button variant="outline" onClick={()=>{checkAndBlockDrivers();toast.success("Vérification effectuée");}}>Vérifier blocages</Button>
              <Button variant="destructive" onClick={()=>{resetMonthlyCounters();toast.success("Compteurs réinitialisés");}}>Reset mensuel</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Chauffeurs bloqués ({blocked.length})</CardTitle></CardHeader>
        <CardContent>
          {blocked.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun chauffeur bloqué</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Tél</TableHead><TableHead>Clients</TableHead></TableRow></TableHeader>
              <TableBody>
                {blocked.map(d=>(
                  <TableRow key={d.id}><TableCell>{d.name}</TableCell><TableCell>{d.phone}</TableCell><TableCell>{d.clientsThisMonth}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Codes de déblocage générés</CardTitle></CardHeader>
        <CardContent>
          {codes.length === 0 ? <p className="text-sm text-muted-foreground">Aucun code</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Chauffeur</TableHead><TableHead>Code</TableHead><TableHead>Créé</TableHead><TableHead>Expire</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
              <TableBody>
                {codes.map(c=>{
                  const d = drivers.find(x=>x.id===c.driverId);
                  const expired = new Date(c.expiresAt) < new Date();
                  return (
                    <TableRow key={c.id}>
                      <TableCell>{d?.name || "—"}</TableCell>
                      <TableCell className="font-mono font-bold">{c.code}</TableCell>
                      <TableCell className="text-xs">{new Date(c.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{new Date(c.expiresAt).toLocaleString()}</TableCell>
                      <TableCell>{c.used ? <Badge>Utilisé</Badge> : expired ? <Badge variant="destructive">Expiré</Badge> : <Badge className="bg-green-600 hover:bg-green-600">Actif</Badge>}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
