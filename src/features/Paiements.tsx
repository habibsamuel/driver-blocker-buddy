import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export function Paiements() {
  const { rides, drivers, clients, markRidePaid } = useStore();
  const paid = rides.filter((r) => r.paid).reduce((s, r) => s + r.total, 0);
  const pending = rides.filter((r) => !r.paid).reduce((s, r) => s + r.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paiements</h1>
        <p className="text-muted-foreground">Suivi financier des courses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground uppercase">Encaissé</p><p className="text-2xl font-bold text-green-600">{paid.toLocaleString()} XAF</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground uppercase">En attente</p><p className="text-2xl font-bold text-amber-600">{pending.toLocaleString()} XAF</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground uppercase">Total courses</p><p className="text-2xl font-bold">{rides.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Historique des courses</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Chauffeur</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Trajet</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rides.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucune course</TableCell></TableRow>}
              {rides.map((r) => {
                const d = drivers.find(x=>x.id===r.driverId);
                const c = clients.find(x=>x.id===r.clientId);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{new Date(r.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{d?.name || "—"}</TableCell>
                    <TableCell>{c?.name || "—"}</TableCell>
                    <TableCell className="text-xs">{r.from} → {r.to}</TableCell>
                    <TableCell className="text-right font-medium">{r.total} XAF</TableCell>
                    <TableCell>{r.paid ? <Badge className="bg-green-600 hover:bg-green-600">Payé</Badge> : <Badge variant="outline">En attente</Badge>}</TableCell>
                    <TableCell className="text-right">
                      {!r.paid && <Button size="sm" onClick={()=>{markRidePaid(r.id);toast.success("Paiement confirmé");}}>Marquer payé</Button>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
