import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useStore, type VehicleClass } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { isValidName, isValidPhone } from "@/lib/validation";
import { Car } from "lucide-react";

export function InscriptionChauffeur() {
  const navigate = useNavigate();
  const { addDriver, settings } = useStore();
  const [form, setForm] = useState({
    name: "", phone: "", zone: "", vehicle: "", plate: "",
    vehicleClass: "eco" as VehicleClass, accessPin: "", accessPinConfirm: "",
  });

  const submit = () => {
    if (!isValidName(form.name)) return toast.error("Nom invalide");
    if (!isValidPhone(form.phone)) return toast.error("Téléphone invalide");
    if (!form.zone.trim()) return toast.error("Zone requise");
    if (!form.vehicle.trim()) return toast.error("Véhicule requis");
    if (!form.plate.trim()) return toast.error("Plaque requise");
    if (!/^\d{4}$/.test(form.accessPin)) return toast.error("Choisissez un code d'accès à 4 chiffres");
    if (form.accessPin !== form.accessPinConfirm) return toast.error("Les codes d'accès ne correspondent pas");
    addDriver({
      name: form.name.trim(),
      phone: form.phone.trim(),
      zone: form.zone.trim(),
      vehicle: form.vehicle.trim(),
      plate: form.plate.trim().toUpperCase(),
      vehicleClass: form.vehicleClass,
      accessPin: form.accessPin,
    });
    toast.success("Inscription envoyée — gardez votre code d'accès secret");
    navigate({ to: "/" });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Car className="h-7 w-7 text-primary" /> Devenir chauffeur
        </h1>
        <p className="text-muted-foreground">Rejoignez la flotte Taxi Proxi Yaoundé en 2 minutes</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Vos informations</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nom complet *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Téléphone *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="6XX XXX XXX" /></div>
          </div>
          <div><Label>Zone principale *</Label><Input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} placeholder="Bastos, Mendong…" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Véhicule *</Label><Input value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} placeholder="Toyota Corolla" /></div>
            <div><Label>Plaque *</Label><Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} placeholder="CE 234 AB" /></div>
          </div>
          <div>
            <Label>Catégorie de service</Label>
            <Select value={form.vehicleClass} onValueChange={(v: VehicleClass) => setForm({ ...form, vehicleClass: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="moto">Bend-Skin (moto-taxi) — ×{settings.classMultipliers.moto}</SelectItem>
                <SelectItem value="eco">Éco (voiture standard) — ×{settings.classMultipliers.eco}</SelectItem>
                <SelectItem value="confort">Confort (berline climatisée) — ×{settings.classMultipliers.confort}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="bg-muted rounded-lg p-3 text-xs space-y-1">
            <p><b>Conditions :</b></p>
            <ul className="list-disc list-inside text-muted-foreground">
              <li>10 premières courses du mois : gratuit</li>
              <li>Au-delà de 10 : abonnement de {settings.subscription1} XAF</li>
              <li>Au-delà de 20 : abonnement de {settings.subscription2} XAF</li>
              <li>Paiement en cash uniquement (post-course)</li>
            </ul>
          </div>
          <Button onClick={submit} className="w-full" size="lg">Envoyer ma candidature</Button>
        </CardContent>
      </Card>
    </div>
  );
}
