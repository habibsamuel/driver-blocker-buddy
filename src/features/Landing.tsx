import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Bike, ShieldCheck, MapPin, Wallet, Star, ArrowRight, CheckCircle2, Clock3, Smartphone, ChevronRight } from "lucide-react";

export function Landing() {
  return (
    <div className="min-h-full bg-background pb-16">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[2rem] bg-zinc-950 text-white shadow-2xl ring-1 ring-yellow-400/20">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-yellow-400/15 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-yellow-400/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:32px_32px]" />
        </div>

        <div className="relative grid items-center gap-10 px-5 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.1fr_.9fr] lg:px-14 lg:py-16">
          <div className="max-w-2xl space-y-6">
            <Badge className="border border-yellow-400/30 bg-yellow-400/10 px-3 py-1.5 text-yellow-300 hover:bg-yellow-400/10">
              <MapPin className="mr-1.5 h-3.5 w-3.5" /> Yaoundé · service local
            </Badge>

            <div className="space-y-4">
              <h1 className="text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
                Votre trajet,
                <br />
                <span className="text-yellow-400">simplement.</span>
              </h1>
              <p className="max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
                Réservez un chauffeur près de vous, suivez votre course et payez selon votre préférence. Taxi Proxi est pensé pour les trajets du quotidien à Yaoundé.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/course" className="w-full sm:w-auto">
                <Button size="lg" className="h-12 w-full bg-yellow-400 px-6 font-extrabold text-black shadow-lg shadow-yellow-400/10 hover:bg-yellow-300 sm:w-auto">
                  Réserver un taxi <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/inscription-chauffeur" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="h-12 w-full border-zinc-700 bg-white/5 px-6 font-semibold text-white hover:bg-white/10 hover:text-white sm:w-auto">
                  Devenir chauffeur
                </Button>
              </Link>
            </div>

            <div className="grid gap-3 pt-1 text-xs text-zinc-400 sm:grid-cols-3">
              <TrustItem icon={ShieldCheck} text="Course protégée" />
              <TrustItem icon={Clock3} text="Suivi en temps réel" />
              <TrustItem icon={Wallet} text="Cash ou Mobile Money" />
            </div>
          </div>

          {/* Booking preview — visuel uniquement, aucun nouvel état */}
          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-xl sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Aperçu</p>
                  <h2 className="mt-1 text-lg font-bold">Choisissez votre véhicule</h2>
                </div>
                <div className="rounded-full bg-yellow-400/10 px-2.5 py-1 text-[11px] font-semibold text-yellow-300">Disponible</div>
              </div>

              <div className="space-y-2.5">
                <RideOption icon={Bike} title="Moto Proxi" price="Dès 500 XAF" desc="Agile dans le trafic" highlight />
                <RideOption icon={Car} title="Taxi Standard" price="Dès 1 500 XAF" desc="Pour les trajets du quotidien" />
                <RideOption icon={Car} title="Taxi Proxi Confort" price="Dès 3 000 XAF" desc="Berline privée et climatisée" />
              </div>

              <Link to="/course" className="mt-4 block">
                <Button className="h-11 w-full bg-yellow-400 font-bold text-black hover:bg-yellow-300">
                  Commander maintenant <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-zinc-500">
                <Smartphone className="h-3.5 w-3.5" /> Réservation optimisée pour mobile
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="mt-12 sm:mt-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">Pourquoi Taxi Proxi ?</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Tout ce qu'il faut pour voyager sereinement</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Feature icon={MapPin} title="Local et proche" desc="Une expérience pensée pour les déplacements à Yaoundé." />
          <Feature icon={ShieldCheck} title="Course sécurisée" desc="Un code PIN confirme votre trajet avec le chauffeur." />
          <Feature icon={Wallet} title="Paiement flexible" desc="Cash, MTN Mobile Money ou Orange Money selon votre choix." />
          <Feature icon={Star} title="Chauffeurs évalués" desc="Consultez les évaluations et gardez le contrôle." />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mt-12 rounded-[2rem] bg-card p-6 ring-1 ring-border sm:mt-16 sm:p-10">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-3">En 3 étapes</Badge>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Réserver devient facile</h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">Un parcours court, clair et adapté à votre téléphone.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Step n="01" title="Indiquez votre destination" desc="Activez votre position et renseignez où vous souhaitez aller." />
          <Step n="02" title="Choisissez votre trajet" desc="Comparez les catégories et visualisez votre estimation." />
          <Step n="03" title="Suivez et profitez" desc="Recevez les informations du chauffeur puis suivez la course." />
        </div>
      </section>

      {/* DRIVER CTA */}
      <section className="mt-12 overflow-hidden rounded-[2rem] bg-yellow-400 p-6 text-black shadow-xl shadow-yellow-400/10 sm:mt-16 sm:p-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-black/60">Vous êtes chauffeur ?</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Rejoignez le réseau Taxi Proxi</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-black/70 sm:text-base">
              Créez votre profil, complétez vos informations et commencez à recevoir des demandes de course.
            </p>
          </div>
          <Link to="/inscription-chauffeur" className="w-full md:w-auto">
            <Button size="lg" className="h-12 w-full bg-black px-6 font-bold text-white hover:bg-zinc-800 md:w-auto">
              Devenir chauffeur <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mt-12 px-2 text-center sm:mt-16">
        <p className="text-sm font-semibold text-primary">Taxi Proxi</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Prêt pour votre prochain trajet ?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          Lancez votre réservation et laissez-nous vous accompagner jusqu'à destination.
        </p>
        <Link to="/course" className="mt-5 inline-flex">
          <Button size="lg" className="h-12 px-7 font-bold">
            Commencer <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </section>
    </div>
  );
}

function TrustItem({ icon: Icon, text }: { icon: typeof ShieldCheck; text: string }) {
  return (
    <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
      <Icon className="h-3.5 w-3.5 text-yellow-400" />
      {text}
    </span>
  );
}

function RideOption({ icon: Icon, title, price, desc, highlight }: { icon: typeof Car; title: string; price: string; desc: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl p-3.5 transition ${highlight ? "bg-yellow-400/10 ring-1 ring-yellow-400/40" : "bg-white/[0.04] ring-1 ring-white/5 hover:bg-white/[0.07]"}`}>
      <div className={`rounded-xl p-2.5 ${highlight ? "bg-yellow-400 text-black" : "bg-zinc-800 text-yellow-400"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="font-bold text-white">{title}</span>
          <span className="shrink-0 text-xs font-bold text-yellow-300">{price}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-zinc-400">{desc}</p>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: typeof MapPin; title: string; desc: string }) {
  return (
    <div className="group rounded-2xl bg-card p-5 ring-1 ring-border transition hover:-translate-y-0.5 hover:ring-primary/30">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-bold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{desc}</p>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="relative rounded-2xl bg-muted/40 p-5 ring-1 ring-border/60">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-black text-primary-foreground">{n}</div>
        <h3 className="font-bold tracking-tight">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{desc}</p>
      <CheckCircle2 className="absolute right-4 top-4 h-4 w-4 text-primary/50" />
    </div>
  );
}
