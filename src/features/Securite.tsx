import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Phone, Shield, Share2, Save } from "lucide-react";
import { toast } from "sonner";
import { isValidPhone } from "@/lib/validation";

export function Securite() {
  const { settings, trustedContact, setTrustedContact, rides } = useStore();
  const [contact, setContact] = useState(trustedContact);

  const lastActive = [...rides].find((r) => r.status === "ongoing" || r.status === "pending");

  const handleSave = () => {
    const c = contact.trim();
    if (c && !isValidPhone(c)) { toast.error("Téléphone invalide"); return; }
    setTrustedContact(c);
    toast.success("Contact de confiance enregistré");
  };

  const handleShareCurrent = () => {
    if (!lastActive) { toast.error("Aucune course active à partager"); return; }
    const url = `${window.location.origin}/?trip=${lastActive.shareToken}`;
    const text = `🚖 Je suis en course Taxi Proxi : ${lastActive.from} → ${lastActive.to}. Suivez-moi : ${url}`;
    const wa = `https://wa.me/${(contact || settings.supportNumber).replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
    window.open(wa, "_blank");
  };

  const handleSOS = () => {
    window.location.href = `tel:${settings.emergencyNumber}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" /> Centre de sécurité
        </h1>
        <p className="text-muted-foreground">Numéros d'urgence, partage de trajet, code PIN de démarrage</p>
      </div>

      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Urgence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">En cas de danger immédiat, appelez la police ou notre support.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSOS} className="bg-destructive hover:bg-destructive/90">
              <Phone className="h-4 w-4 mr-2" /> Police {settings.emergencyNumber}
            </Button>
            <Button variant="outline" asChild>
              <a href={`tel:${settings.supportNumber}`}><Phone className="h-4 w-4 mr-2" /> Support Taxi Proxi</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="tel:118"><Phone className="h-4 w-4 mr-2" /> Pompiers 118</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="tel:119"><Phone className="h-4 w-4 mr-2" /> Gendarmerie 119</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" /> Partager mon trajet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Numéro du contact de confiance</Label>
            <div className="flex gap-2">
              <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="6XX XXX XXX" />
              <Button onClick={handleSave}><Save className="h-4 w-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Ce numéro recevra par WhatsApp le lien de suivi de chaque course que vous partagez.
            </p>
          </div>
          <Button onClick={handleShareCurrent} disabled={!lastActive} className="w-full">
            <Share2 className="h-4 w-4 mr-2" />
            {lastActive ? `Partager ma course active (${lastActive.from} → ${lastActive.to})` : "Aucune course active"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Code PIN de démarrage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Chaque course génère un <b>PIN à 4 chiffres</b>. Le client le communique au chauffeur
            au moment de monter dans le véhicule pour démarrer la course. Cela garantit que :
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Vous montez dans le bon véhicule (et non chez un imposteur)</li>
            <li>Le chauffeur ne facture pas une course non commencée</li>
            <li>Le système conserve une preuve horodatée de démarrage</li>
          </ul>
          <Badge variant="outline" className="mt-2">Activé sur 100% des courses</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
