import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const handleSignIn = async () => {
    if (!email.trim() || !password) { toast.error("Email et mot de passe requis"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      if (error.message.includes("Invalid login")) toast.error("Email ou mot de passe incorrect");
      else toast.error(error.message);
    } else {
      toast.success("Connexion réussie");
      navigate({ to: "/" });
    }
  };

  const handleSignUp = async () => {
    if (!name.trim()) { toast.error("Indiquez votre nom"); return; }
    if (!email.trim() || !email.includes("@")) { toast.error("Email invalide"); return; }
    if (password.length < 6) { toast.error("Mot de passe : 6 caractères minimum"); return; }
    setLoading(true);
    const cleanCode = referralCode.trim().toUpperCase();
    if (cleanCode) {
      const { data: ok } = await supabase.rpc("referral_code_exists", { _code: cleanCode });
      if (!ok) { setLoading(false); toast.error("Code de parrainage invalide"); return; }
    }
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim(), phone: phone.trim(), referral_code: cleanCode }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("already")) toast.error("Cet email est déjà inscrit — connectez-vous");
      else toast.error(error.message);
    } else {
      toast.success("Compte créé ! Bienvenue sur Taxi Proxi 🚖");
      navigate({ to: "/" });
    }
  };

  const handleGoogle = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error(res.error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🚖</div>
          <CardTitle className="text-2xl text-primary">TAXI PROXI</CardTitle>
          <p className="text-sm text-muted-foreground">Votre taxi à Yaoundé en quelques clics</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signup">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signup">Inscription</TabsTrigger>
              <TabsTrigger value="signin">Connexion</TabsTrigger>
            </TabsList>

            <TabsContent value="signup" className="space-y-3 mt-4">
              <div><Label>Nom complet *</Label><Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Jean Dupont" /></div>
              <div><Label>Téléphone</Label><Input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="6XX XXX XXX" /></div>
              <div><Label>Email *</Label><Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="vous@email.com" /></div>
              <div><Label>Mot de passe * (6+ caractères)</Label><Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} /></div>
              <div>
                <Label>Code de parrainage (optionnel) 🎁</Label>
                <Input
                  value={referralCode}
                  onChange={(e)=>setReferralCode(e.target.value.toUpperCase())}
                  placeholder="TAXI-XXXXXX"
                  className="uppercase tracking-widest"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Un ami vous a invité ? Gagnez 500 XAF chacun.</p>
              </div>
              <Button className="w-full bg-primary text-primary-foreground" disabled={loading} onClick={handleSignUp}>
                {loading ? "Création…" : "Créer mon compte"}
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">
                Pas besoin de confirmer votre email — vous êtes connecté directement.
              </p>
            </TabsContent>

            <TabsContent value="signin" className="space-y-3 mt-4">
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} /></div>
              <div><Label>Mot de passe</Label><Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} /></div>
              <Button className="w-full bg-primary text-primary-foreground" disabled={loading} onClick={handleSignIn}>
                {loading ? "Connexion…" : "Se connecter"}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogle}>
            Continuer avec Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
