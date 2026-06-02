import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { isValidName, isValidPhone, sanitizeText } from "@/lib/validation";

export function Clients() {
  const { clients, rides, addClient, deleteClient } = useStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", quartier: "" });

  const filtered = clients.filter((c) =>
    [c.name, c.phone, c.quartier].some((v) => v.toLowerCase().includes(search.toLowerCase())),
  );

  const handleAdd = () => {
    const name = form.name.trim();
    const phone = form.phone.trim();
    const quartier = sanitizeText(form.quartier, 60);
    if (!isValidName(name)) { toast.error("Nom invalide (2-60 caractères)"); return; }
    if (phone && !isValidPhone(phone)) { toast.error("Téléphone invalide"); return; }
    addClient({ name, phone, quartier });
    setForm({ name: "", phone: "", quartier: "" });
    setOpen(false);
    toast.success("Client ajouté");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Carnet de clients & historique</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Ajouter client</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouveau client</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nom</Label><Input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} /></div>
              <div><Label>Téléphone</Label><Input value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} /></div>
              <div><Label>Quartier</Label><Input value={form.quartier} onChange={(e)=>setForm({...form,quartier:e.target.value})} /></div>
            </div>
            <DialogFooter><Button onClick={handleAdd}>Enregistrer</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <Input placeholder="Rechercher par nom ou quartier..." value={search} onChange={(e)=>setSearch(e.target.value)} className="max-w-sm" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Quartier</TableHead>
                <TableHead className="text-center">Courses</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucun client</TableCell></TableRow>}
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell>{c.quartier}</TableCell>
                  <TableCell className="text-center">{rides.filter(r=>r.clientId===c.id).length}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={()=>deleteClient(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
