import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Share2, Gift, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

type ReferralRow = { referee_id: string; reward_amount: number; created_at: string };
type RefereeProfile = { user_id: string; name: string };

export function Parrainage() {
  const { user, loading } = useAuth();
  const [code, setCode] = useState<string>("");
  const [credit, setCredit] = useState<number>(0);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [referees, setReferees] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      const [{ data: profile }, { data: refs }] = await Promise.all([
        supabase.from("profiles").select("referral_code, referral_credit").eq("user_id", user.id).maybeSingle(),
        supabase.from("referrals").select("referee_id, reward_amount, created_at").eq("referrer_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      setCode(profile?.referral_code ?? "");
      setCredit(profile?.referral_credit ?? 0);
      const list = (refs ?? []) as ReferralRow[];
      setReferrals(list);
      if (list.length) {
        const ids = list.map((r) => r.referee_id);
        const { data: names } = await supabase.from("profiles").select("user_id, name").in("user_id", ids);
        if (!cancelled) {
          const map: Record<string, string> = {};
          (names ?? []).forEach((p: RefereeProfile) => (map[p.user_id] = p.name || "Filleul"));
          setReferees(map);
        }
      }
      setBusy(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) return <div className="p-6">Chargement…</div>;
  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center space-y-4">
        <Gift className="h-12 w-12 mx-auto text-primary" />
        <h2 className="text-2xl font-bold">Parrainez et gagnez</h2>
        <p className="text-muted-foreground">Connectez-vous pour obtenir votre code de parrainage.</p>
        <Link to="/auth"><Button className="bg-primary text-primary-foreground">Se connecter</Button></Link>
      </div>
    );
  }

  const shareText = `🚖 Rejoins-moi sur Taxi Proxi ! Utilise mon code ${code} à l'inscription et on gagne 500 XAF chacun. ${window.location.origin}/auth`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    toast.success("Code copié !");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Taxi Proxi", text: shareText, url: `${window.location.origin}/auth` });
      } catch { /* user cancelled */ }
    } else {
      const wa = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(wa, "_blank");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="text-center space-y-1">
        <div className="text-4xl">🎁</div>
        <h1 className="text-2xl font-black">Parrainage</h1>
        <p className="text-sm text-muted-foreground">Invitez vos amis, gagnez <b>500 XAF</b> chacun à leur inscription.</p>
      </div>

      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Votre code de parrainage</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="text-3xl font-mono font-black text-center tracking-widest select-all bg-background rounded-lg py-4 border-2 border-dashed border-primary/40">
            {busy ? "…" : code || "—"}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleCopy} disabled={!code}><Copy className="h-4 w-4 mr-2" />Copier</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleShare} disabled={!code}><Share2 className="h-4 w-4 mr-2" />Partager</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <Users className="h-5 w-5 mx-auto text-primary mb-1" />
            <div className="text-2xl font-black">{referrals.length}</div>
            <div className="text-xs text-muted-foreground">Filleul{referrals.length > 1 ? "s" : ""}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Wallet className="h-5 w-5 mx-auto text-primary mb-1" />
            <div className="text-2xl font-black">{credit.toLocaleString()} <span className="text-xs">XAF</span></div>
            <div className="text-xs text-muted-foreground">Solde gagné</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Vos filleuls</CardTitle></CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucun filleul pour l'instant. Partagez votre code !</p>
          ) : (
            <ul className="space-y-2">
              {referrals.map((r) => {
                const name = referees[r.referee_id] || "Filleul";
                const masked = name.length > 1 ? `${name.split(" ")[0]} ${name.split(" ")[1]?.[0] ?? ""}.`.trim() : name;
                return (
                  <li key={r.referee_id} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                    <span className="font-medium">{masked}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
                      <Badge className="bg-primary/15 text-primary">+{r.reward_amount} XAF</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground text-center px-4">
        Le crédit est cumulé et sera déductible de vos prochaines courses (bientôt disponible dans le paiement).
      </div>
    </div>
  );
}
