import { useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { KeyRound, Lock } from "lucide-react";

const SESSION_KEY = "chauffeur_unlocked_id";

export function ChauffeurGate({ children }: { children: ReactNode }) {
  const { drivers } = useStore();
  const [unlockedId, setUnlockedId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    // Migration : ancien stockage en sessionStorage → localStorage
    const legacy = sessionStorage.getItem(SESSION_KEY);
    if (legacy) {
      localStorage.setItem(SESSION_KEY, legacy);
      sessionStorage.removeItem(SESSION_KEY);
      return legacy;
    }
    return localStorage.getItem(SESSION_KEY);
  });
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [tries, setTries] = useState(0);

  if (unlockedId && drivers.some((d) => d.id === unlockedId)) {
    return (
      <div className="space-y-3">
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              sessionStorage.removeItem(SESSION_KEY);
              setUnlockedId(null);
            }}
          >
            <Lock className="h-4 w-4 mr-2" /> Verrouiller
          </Button>
        </div>
        {children}
      </div>
    );
  }

  const submit = () => {
    if (tries >= 5) {
      toast.error("Trop de tentatives. Réessayez plus tard.");
      return;
    }
    const cleanPhone = phone.replace(/\s/g, "");
    const driver = drivers.find(
      (d) => d.phone.replace(/\s/g, "") === cleanPhone && d.accessPin === pin,
    );
    if (!driver) {
      setTries((t) => t + 1);
      toast.error("Téléphone ou code d'accès incorrect");
      return;
    }
    sessionStorage.setItem(SESSION_KEY, driver.id);
    setUnlockedId(driver.id);
    toast.success(`Bienvenue ${driver.name}`);
  };

  return (
    <div className="max-w-md mx-auto pt-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" /> Accès espace chauffeur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Saisissez votre téléphone et le code d'accès défini lors de votre inscription.
          </p>
          <div>
            <Label>Téléphone</Label>
            <Input
              inputMode="tel"
              placeholder="6XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <div>
            <Label>Code d'accès (4 chiffres)</Label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <Button className="w-full" size="lg" onClick={submit} disabled={!phone || pin.length !== 4}>
            Déverrouiller
          </Button>
          {tries > 0 && (
            <p className="text-xs text-destructive">
              Tentatives échouées : {tries}/5
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
