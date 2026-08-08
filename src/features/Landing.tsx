import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Bike, Shield, MapPin, Wallet, Star, ArrowRight, CheckCircle2 } from "lucide-react";

export function Landing() {
  return (
    <div className="space-y-16 pb-16">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white ring-1 ring-yellow-400/30 shadow-2xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none"
             style={{ backgroundImage: "radial-gradient(circle at 20% 20%, #FFD400 0%, transparent 40%), radial-gradient(circle at 80% 80%, #FFD400 0%, transparent 40%)" }} />
        <div className="relative px-6 sm:px-10 py-14 sm:py-20 grid gap-8 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <Badge className="bg-yellow-400 text-black hover:bg-yellow-300 font-bold">🚖 Yaoundé · 100% local</Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
              Votre taxi à Yaoundé,<br />
              <span className="text-yellow-400">en 30 secondes.</span>
            </h1>
            <p className="text-lg text-zinc-300 max-w-xl">
              Bend-Skin, Éco ou Confort — géolocalisation en temps réel, paiement cash ou Mobile Money, code PIN de sécurité. Trouvez et évaluez les chauffeurs près de chez vous.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/course">
                <Button size="lg" className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-base h-12 px-6 shadow-xl">
                  Réserver un taxi <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/inscription-chauffeur">
                <Button size="lg" variant="outline" className="border-yellow-400/60 text-yellow-400 hover:bg-yellow-400/10 h-12 px-6 font-semibold bg-transparent">
                  Devenir chauffeur
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-zinc-400">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-yellow-400" /> Sans commission cachée</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-yellow-400" /> MTN MoMo · Orange Money</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-yellow-400" /> Support 24/7</span>
            </div>
          </div>

          {/* Visual card */}
          <div className="relative">
            <div className="bg-zinc-900/80 backdrop-blur rounded-2xl p-6 ring-1 ring-yellow-400/30 shadow-2xl">
              <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Choisissez votre course</div>
              <div className="space-y-3">
                <RideOption icon={Bike} title="Bend-Skin" price="500 XAF" desc="Rapide, agile, idéal en trafic" highlight />
                <RideOption icon={Car} title="Éco" price="1 500 XAF" desc="Taxi partagé, économique" />
                <RideOption icon={Car} title="Confort" price="3 000 XAF" desc="Course privée, climatisée" />
              </div>
              <Link to="/course" className="block mt-4">
                <Button className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold h-11">
                  Commander maintenant
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Feature icon={MapPin} title="Géolocalisation temps réel" desc="Suivez votre chauffeur sur la carte, minute par minute." />
        <Feature icon={Shield} title="Code PIN sécurisé" desc="Un code unique confirme votre course et protège votre trajet." />
        <Feature icon={Wallet} title="Paiement flexible" desc="Cash, MTN Mobile Money ou Orange Money — au choix." />
        <Feature icon={Star} title="Chauffeurs notés" desc="Évaluations transparentes, fiabilité vérifiée." />
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-zinc-950 text-white rounded-3xl p-8 sm:p-10 ring-1 ring-zinc-800">
        <h2 className="text-3xl font-black mb-8 text-center">Comment ça marche</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <Step n="1" title="Créez votre compte" desc="Inscription gratuite en 30 secondes." />
          <Step n="2" title="Indiquez votre destination" desc="On vous géolocalise, vous choisissez où aller." />
          <Step n="3" title="Montez et payez" desc="Cash ou Mobile Money — notez votre chauffeur." />
        </div>
      </section>

      {/* CTA */}
      <section className="text-center space-y-4 py-6">
        <h2 className="text-3xl sm:text-4xl font-black">Prêt à réserver ?</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">Rejoignez les Yaoundéens qui gagnent du temps chaque jour avec Taxi Proxi.</p>
        <Link to="/auth">
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base h-12 px-8">
            Commencer <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </section>
    </div>
  );
}

function RideOption({ icon: Icon, title, price, desc, highlight }: { icon: any; title: string; price: string; desc: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition ${highlight ? "bg-yellow-400/10 ring-1 ring-yellow-400/40" : "bg-zinc-800/50 hover:bg-zinc-800"}`}>
      <div className={`rounded-lg p-2 ${highlight ? "bg-yellow-400 text-black" : "bg-zinc-700 text-yellow-400"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-white">{title}</span>
          <span className="text-yellow-400 font-bold text-sm">{price}</span>
        </div>
        <p className="text-xs text-zinc-400 truncate">{desc}</p>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="bg-card rounded-2xl p-5 ring-1 ring-border hover:ring-primary/40 transition">
      <div className="bg-primary/10 text-primary rounded-xl p-2 w-fit mb-3">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-bold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="space-y-2">
      <div className="bg-yellow-400 text-black rounded-full h-10 w-10 flex items-center justify-center font-black text-lg">{n}</div>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-zinc-400">{desc}</p>
    </div>
  );
}
