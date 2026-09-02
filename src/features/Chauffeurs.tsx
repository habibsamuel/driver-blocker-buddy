import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Lock, Unlock, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { isValidName, isValidPhone, isValidUnlockCode } from "@/lib/validation";

export function Chauffeurs() {
  const { drivers, settings, addDriver, deleteDriver, updateDriver, generateUnlockCode, redeemCode } = useStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", zone: "", accessPin: "" });
  const [redeemFor, setRedeemFor] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");

  const filtered = drivers.filter((d) =>
    [d.name, d.phone, d.zone].some((v) => v.toLowerCase().includes(search.toLowerCase())),
  );

  const handleAdd = () => {
    const name = form.name.trim();
    const phone = form.phone.trim();
    const zone = form.zone.trim().slice(0, 60);
    const accessPin = form.accessPin.trim();
    if (!isValidName(name)) { toast.error("Nom invalide (2-60 caractères, lettres)"); return; }
    if (!isValidPhone(phone)) { toast.error("Téléphone invalide (8-15 chiffres)"); return; }
    if (!/^\d{4}$/.test(accessPin)) { toast.error("Le code d'accès doit comporter exactement 4 chiffres"); return; }
    addDriver({ name, phone, zone, accessPin });
    setForm({ name: "", phone: "", zone: "", accessPin: "" });
    setOpen(false);
    toast.success("Chauffeur ajouté");
  };

  const handleGenerate = (id: string, name: string) => {
    const c = generateUnlockCode(id);
    if (c) toast.success(`Code pour ${name}: ${c.code}`, { duration: 10000, description: "Valide 24h" });
  };

  const handleRedeem = () => {
    if (!redeemFor) return;
    const code = codeInput.trim();
    if (!isValidUnlockCode(code)) { toast.error("Code à 6 chiffres requis"); return; }
    const r = redeemCode(redeemFor, code);
    if (r.ok) toast.success(r.msg); else toast.error(r.msg);
    setRedeemFor(null); setCodeInput("");
  };

  const handleMarkPaid = (id: string) => {
    updateDriver(id, { subscriptionPaid: true, blocked: false, thresholdReachedAt: null });
    toast.success("Abonnement marqué comme payé");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chauffeurs</h1>
          <p className="text-muted-foreground">Gestion et suivi des abonnements</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Ajouter chauffeur</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouveau chauffeur</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nom complet</Label><Input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} /></div>
              <div><Label>Téléphone</Label><Input value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} /></div>
              <div><Label>Zone</Label><Input value={form.zone} onChange={(e)=>setForm({...form,zone:e.target.value})} /></div>
              <div>
                <Label>Code d'accès (4 chiffres) *</Label>
                <Input
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={form.accessPin}
                  onChange={(e)=>setForm({...form, accessPin: e.target.value.replace(/\D/g, "").slice(0,4)})}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Le chauffeur devra saisir ce code pour accéder à son espace.
                </p>
              </div>
            </div>
            <DialogFooter><Button onClick={handleAdd}>Enregistrer</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <Input placeholder="Rechercher..." value={search} onChange={(e)=>setSearch(e.target.value)} className="max-w-sm" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead className="text-center">Clients/mois</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun chauffeur</TableCell></TableRow>
              )}
              {filtered.map((d) => {
                const palierBase = d.clientsThisMonth >= settings.threshold2 ? settings.subscription2 : d.clientsThisMonth >= settings.threshold1 ? settings.subscription1 : 0;
                const palier = d.subscriptionPaid ? 0 : palierBase;
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">
                      {d.name}
                      {d.rating > 0 && (
                        <span className="ml-2 text-xs text-amber-500">★ {d.rating.toFixed(1)} ({d.ratingsCount})</span>
                      )}
                    </TableCell>
                    <TableCell>{d.phone}</TableCell>
                    <TableCell>{d.zone}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{d.clientsThisMonth}</Badge>
                      {palier > 0 && <div className="text-xs text-muted-foreground mt-1">{palier} XAF dû</div>}
                    </TableCell>
                    <TableCell>
                      {d.blocked ? <Badge variant="destructive"><Lock className="h-3 w-3 mr-1" />Bloqué</Badge>
                        : d.subscriptionPaid ? <Badge className="bg-green-600 hover:bg-green-600">Payé</Badge>
                        : d.thresholdReachedAt ? <Badge className="bg-amber-500 hover:bg-amber-500">À régulariser</Badge>
                        : <Badge variant="outline">Actif</Badge>}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {d.blocked || d.thresholdReachedAt ? (
                        <>
                          <Button size="sm" variant="outline" onClick={()=>handleGenerate(d.id, d.name)} title="Générer code">
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={()=>setRedeemFor(d.id)} title="Saisir code">
                            <Unlock className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={()=>handleMarkPaid(d.id)}>Payé</Button>
                        </>
                      ) : null}
                      <Button size="sm" variant="ghost" onClick={()=>deleteDriver(d.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!redeemFor} onOpenChange={(o)=>!o && setRedeemFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Saisir le code de déblocage</DialogTitle></DialogHeader>
          <Input placeholder="Code à 6 chiffres" value={codeInput} onChange={(e)=>setCodeInput(e.target.value)} />
          <DialogFooter><Button onClick={handleRedeem}>Valider</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
