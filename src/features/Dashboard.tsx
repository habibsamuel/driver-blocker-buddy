import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Car, Users, Wallet, TrendingUp } from "lucide-react";

export function Dashboard() {
  const { drivers, clients, rides, settings, checkAndBlockDrivers, seedDemo } =
    useStore();

  useEffect(() => {
    checkAndBlockDrivers();
  }, [checkAndBlockDrivers]);

  const totalRevenue = rides.filter((r) => r.paid).reduce((s, r) => s + r.total, 0);
  const pending = rides.filter((r) => !r.paid).reduce((s, r) => s + r.total, 0);
  const ongoing = rides.filter((r) => !r.paid).length;
  const blocked = drivers.filter((d) => d.blocked);
  const atRisk = drivers.filter(
    (d) => !d.blocked && !d.subscriptionPaid && d.thresholdReachedAt,
  );

  const zoneStats = clients.reduce<Record<string, number>>((acc, c) => {
    acc[c.quartier] = (acc[c.quartier] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">Vue d'ensemble de l'activité</p>
        </div>
        {drivers.length === 0 && (
          <Button onClick={seedDemo} variant="outline">
            Charger données de démo
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Wallet} label="Revenus encaissés" value={`${totalRevenue.toLocaleString()} XAF`} />
        <StatCard icon={TrendingUp} label="En attente" value={`${pending.toLocaleString()} XAF`} />
        <StatCard icon={Car} label="Courses actives" value={String(ongoing)} />
        <StatCard icon={Users} label="Chauffeurs actifs" value={`${drivers.filter(d=>!d.blocked).length} / ${drivers.length}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Chauffeurs à régulariser
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {blocked.length === 0 && atRisk.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aucun chauffeur bloqué ou à risque
              </p>
            )}
            {blocked.map((d) => (
              <div key={d.id} className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.clientsThisMonth} clients ce mois
                  </p>
                </div>
                <Badge variant="destructive">Bloqué</Badge>
              </div>
            ))}
            {atRisk.map((d) => {
              const amount = d.clientsThisMonth >= settings.threshold2 ? settings.subscription2 : settings.subscription1;
              return (
                <div key={d.id} className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <p className="font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.clientsThisMonth} clients · doit {amount} XAF
                    </p>
                  </div>
                  <Badge className="bg-amber-500 hover:bg-amber-500">À régulariser</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques par quartier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.keys(zoneStats).length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune donnée</p>
            )}
            {Object.entries(zoneStats).map(([zone, count]) => (
              <div key={zone} className="flex items-center justify-between">
                <span className="text-sm">{zone}</span>
                <Badge variant="secondary">{count} clients</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
