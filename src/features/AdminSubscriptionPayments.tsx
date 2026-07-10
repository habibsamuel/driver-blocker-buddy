import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Eye, Save } from "lucide-react";

type Payment = {
  id: string;
  driver_id: string;
  plan_id: string;
  amount_xaf: number;
  transaction_reference: string;
  proof_screenshot_url: string | null;
  submitted_at: string;
};

type Plan = { id: string; name: string };

export function AdminSubscriptionPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [settings, setSettings] = useState<{ id?: string; orange_money_number: string; instructions: string }>({ orange_money_number: "", instructions: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const [proofs, setProofs] = useState<Record<string, string>>({});

  const load = async () => {
    const [pay, pl, st] = await Promise.all([
      supabase.from("subscription_payments").select("*").eq("status", "en_attente").order("submitted_at"),
      supabase.from("subscription_plans").select("id,name"),
      supabase.from("payment_settings").select("*").limit(1).maybeSingle(),
    ]);
    if (pay.data) setPayments(pay.data as Payment[]);
    if (pl.data) setPlans(pl.data);
    if (st.data) setSettings(st.data);
  };
  useEffect(() => { load(); }, []);

  const planName = (id: string) => plans.find((p) => p.id === id)?.name ?? "—";

  const viewProof = async (payment: Payment) => {
    if (!payment.proof_screenshot_url) return;
    const { data, error } = await supabase.storage.from("subscription-proofs").createSignedUrl(payment.proof_screenshot_url, 300);
    if (error) { toast.error("Impossible d'ouvrir la preuve"); return; }
    setProofs((prev) => ({ ...prev, [payment.id]: data.signedUrl }));
  };

  const approve = async (id: string) => {
    setBusy(id);
    const { error } = await supabase.rpc("approve_subscription_payment", { _payment_id: id });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Paiement approuvé, abonnement activé");
    load();
  };

  const reject = async (id: string) => {
    setBusy(id);
    const { error } = await supabase.rpc("reject_subscription_payment", { _payment_id: id });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Paiement rejeté");
    load();
  };

  const saveSettings = async () => {
    if (!settings.orange_money_number) { toast.error("Numéro requis"); return; }
    const payload = { orange_money_number: settings.orange_money_number, instructions: settings.instructions };
    const q = settings.id
      ? await supabase.from("payment_settings").update(payload).eq("id", settings.id)
      : await supabase.from("payment_settings").insert(payload);
    if (q.error) { toast.error(q.error.message); return; }
    toast.success("Paramètres enregistrés");
    load();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Paramètres de paiement Orange Money</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>Numéro Orange Money</Label>
            <Input value={settings.orange_money_number} onChange={(e) => setSettings((s) => ({ ...s, orange_money_number: e.target.value }))} />
          </div>
          <div>
            <Label>Instructions affichées</Label>
            <Input value={settings.instructions} onChange={(e) => setSettings((s) => ({ ...s, instructions: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Button onClick={saveSettings}><Save className="h-4 w-4 mr-2" /> Enregistrer</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Paiements chauffeurs en attente ({payments.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {payments.length === 0 && <p className="text-sm text-muted-foreground">Aucun paiement en attente</p>}
          {payments.map((p) => (
            <div key={p.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-xs text-muted-foreground">Chauffeur</div>
                  <div className="font-mono text-xs">{p.driver_id}</div>
                </div>
                <Badge variant="outline">{planName(p.plan_id)}</Badge>
                <div className="font-bold text-primary">{p.amount_xaf.toLocaleString()} XAF</div>
              </div>
              <div className="text-sm">
                Référence : <span className="font-mono">{p.transaction_reference}</span>
              </div>
              <div className="text-xs text-muted-foreground">Soumis le {new Date(p.submitted_at).toLocaleString()}</div>
              {p.proof_screenshot_url && (
                proofs[p.id] ? (
                  <a href={proofs[p.id]} target="_blank" rel="noopener noreferrer">
                    <img src={proofs[p.id]} alt="Preuve" className="max-h-48 rounded border" />
                  </a>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => viewProof(p)}><Eye className="h-3 w-3 mr-1" /> Voir la preuve</Button>
                )
              )}
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="bg-green-600 hover:bg-green-700" disabled={busy === p.id} onClick={() => approve(p.id)}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Approuver
                </Button>
                <Button size="sm" variant="destructive" disabled={busy === p.id} onClick={() => reject(p.id)}>
                  <XCircle className="h-4 w-4 mr-1" /> Rejeter
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
