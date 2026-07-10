import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, Clock, XCircle, Smartphone, Upload } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  price_xaf: number;
  duration_days: number;
  description: string;
};

type Payment = {
  id: string;
  plan_id: string;
  amount_xaf: number;
  transaction_reference: string;
  status: "en_attente" | "approuve" | "rejete";
  submitted_at: string;
};

type Sub = {
  id: string;
  end_date: string;
  status: string;
  plan_id: string;
};

type Settings = { orange_money_number: string; instructions: string };

export function DriverSubscription() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [activeSub, setActiveSub] = useState<Sub | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [driver, setDriver] = useState<{ free_rides_remaining: number; subscription_status: string } | null>(null);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [txRef, setTxRef] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!user) return;
    const [p, s, sub, pay, dr] = await Promise.all([
      supabase.from("subscription_plans").select("*").eq("active", true).order("price_xaf"),
      supabase.from("payment_settings").select("*").limit(1).maybeSingle(),
      supabase.from("driver_subscriptions").select("*").eq("driver_id", user.id).eq("status", "active").gt("end_date", new Date().toISOString()).order("end_date", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("subscription_payments").select("*").eq("driver_id", user.id).order("submitted_at", { ascending: false }).limit(5),
      supabase.from("drivers").select("free_rides_remaining, subscription_status").eq("user_id", user.id).maybeSingle(),
    ]);
    if (p.data) setPlans(p.data);
    if (s.data) setSettings(s.data);
    setActiveSub(sub.data ?? null);
    if (pay.data) setPayments(pay.data as Payment[]);
    if (dr.data) setDriver(dr.data);
    setLoading(false);
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [user?.id]);

  if (!user) return <p className="text-center py-10 text-muted-foreground">Connectez-vous pour accéder aux abonnements.</p>;
  if (loading) return <p className="text-center py-10 text-muted-foreground">Chargement…</p>;

  const submitPayment = async () => {
    if (!selected || !user) return;
    if (txRef.trim().length < 4) { toast.error("Référence de transaction invalide"); return; }
    setSubmitting(true);
    try {
      let proofUrl: string | null = null;
      if (file) {
        const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const up = await supabase.storage.from("subscription-proofs").upload(path, file);
        if (up.error) throw up.error;
        proofUrl = path;
      }
      const { error } = await supabase.from("subscription_payments").insert({
        driver_id: user.id,
        plan_id: selected.id,
        amount_xaf: selected.price_xaf,
        transaction_reference: txRef.trim(),
        proof_screenshot_url: proofUrl,
      });
      if (error) throw error;
      toast.success("Paiement soumis — en attente de vérification");
      setSelected(null); setTxRef(""); setFile(null);
      reload();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la soumission");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Abonnement chauffeur</h1>
        <p className="text-muted-foreground">Gérez votre accès à la plateforme</p>
      </div>

      {driver && (
        <Card>
          <CardHeader><CardTitle>Statut actuel</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {activeSub ? (
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600 hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Actif</Badge>
                <span className="text-sm">Expire le {new Date(activeSub.end_date).toLocaleDateString()}</span>
              </div>
            ) : driver.subscription_status === "essai_gratuit" ? (
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 hover:bg-blue-600">Essai gratuit</Badge>
                <span className="text-sm">{driver.free_rides_remaining} course(s) gratuite(s) restante(s)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Expiré</Badge>
                <span className="text-sm">Choisissez un abonnement pour continuer</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selected && !activeSub && (
        <div className="grid md:grid-cols-2 gap-4">
          {plans.map((p) => (
            <Card key={p.id} className="hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {p.name}
                  <span className="text-primary text-xl">{p.price_xaf.toLocaleString()} XAF</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{p.description}</p>
                <p className="text-xs">Durée : <b>{p.duration_days} jours</b></p>
                <Button className="w-full" onClick={() => setSelected(p)}>Choisir ce plan</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selected && settings && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary" /> Paiement Orange Money</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 space-y-1">
              <p className="text-sm">
                Envoyez <b>{selected.price_xaf.toLocaleString()} XAF</b> au numéro
              </p>
              <p className="text-2xl font-mono font-bold text-primary">{settings.orange_money_number}</p>
              <p className="text-xs text-muted-foreground">{settings.instructions}</p>
            </div>

            <div>
              <Label>Référence de transaction (SMS Orange Money)</Label>
              <Input value={txRef} onChange={(e) => setTxRef(e.target.value)} placeholder="ex: MP240710.1234.A56789" />
            </div>

            <div>
              <Label className="flex items-center gap-2"><Upload className="h-4 w-4" /> Capture d'écran (optionnel)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelected(null)} disabled={submitting}>Retour</Button>
              <Button className="flex-1" onClick={submitPayment} disabled={submitting || !txRef.trim()}>
                {submitting ? "Envoi…" : "Soumettre le paiement"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {payments.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Mes derniers paiements</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between border-b last:border-0 py-2 text-sm">
                <div>
                  <div className="font-mono text-xs">{p.transaction_reference}</div>
                  <div className="text-xs text-muted-foreground">{new Date(p.submitted_at).toLocaleString()} · {p.amount_xaf.toLocaleString()} XAF</div>
                </div>
                {p.status === "en_attente" && <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>}
                {p.status === "approuve" && <Badge className="bg-green-600 hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Approuvé</Badge>}
                {p.status === "rejete" && <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejeté</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
