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
        <h1 className="text-3xl font-black tracking-tight">Paiements</h1>
        <p className="text-sm text-muted-foreground">Suivi financier des courses · paiement en liquide</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="liquid-glass animate-glass-condense border-0"><CardContent className="pt-6"><p className="text-[11px] text-muted-foreground uppercase tracking-widest">Encaissé</p><p className="text-2xl font-black text-success">{paid.toLocaleString()} XAF</p></CardContent></Card>
        <Card className="liquid-glass animate-glass-condense border-0"><CardContent className="pt-6"><p className="text-[11px] text-muted-foreground uppercase tracking-widest">En attente</p><p className="text-2xl font-black text-primary">{pending.toLocaleString()} XAF</p></CardContent></Card>
        <Card className="liquid-glass animate-glass-condense border-0"><CardContent className="pt-6"><p className="text-[11px] text-muted-foreground uppercase tracking-widest">Total courses</p><p className="text-2xl font-black">{rides.length}</p></CardContent></Card>
      </div>

      <Card className="liquid-glass border-0">
        <CardHeader><CardTitle className="text-base">Historique des courses</CardTitle></CardHeader>
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
                    <TableCell className="text-right font-bold">{r.total} XAF</TableCell>
                    <TableCell>{r.paid ? <Badge className="bg-success text-success-foreground hover:bg-success">Payé</Badge> : <Badge variant="outline">En attente</Badge>}</TableCell>
                    <TableCell className="text-right">
                      {!r.paid && <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" onClick={()=>{markRidePaid(r.id);toast.success("Paiement confirmé");}}>Marquer payé</Button>}
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
