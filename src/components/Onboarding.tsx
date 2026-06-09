import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Car, ShieldCheck } from "lucide-react";

const KEY = "taxi-proxi-onboarded-v1";

export function Onboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEY)) setOpen(true);
  }, []);

  const steps = [
    {
      icon: MapPin,
      title: "Bienvenue sur Taxi Proxi 🚖",
      text: "Votre taxi à Yaoundé en 2 clics. Pas besoin d'indiquer votre position — nous vous localisons automatiquement.",
    },
    {
      icon: Navigation,
      title: "Entrez juste votre destination",
      text: "Tapez où vous voulez aller. Nous calculons la distance, le temps et le prix instantanément.",
    },
    {
      icon: Car,
      title: "Suivez votre chauffeur",
      text: "Une fois la course confirmée, vous voyez le chauffeur se déplacer sur la carte en temps réel.",
    },
    {
      icon: ShieldCheck,
      title: "Paiement en liquide, en sécurité",
      text: "Un code PIN à 4 chiffres est généré : communiquez-le au chauffeur à son arrivée pour démarrer la course.",
    },
  ];

  const cur = steps[step];
  const Icon = cur.icon;

  const finish = () => {
    localStorage.setItem(KEY, "1");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) finish(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center mb-2">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-center">{cur.title}</DialogTitle>
          <DialogDescription className="text-center">{cur.text}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-1 py-2">
          {steps.map((_, i) => (
            <span key={i} className={`h-1.5 w-6 rounded-full ${i === step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          <Button variant="ghost" onClick={finish}>Passer</Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} className="bg-primary text-primary-foreground">Suivant</Button>
          ) : (
            <Button onClick={finish} className="bg-primary text-primary-foreground">Commencer</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
