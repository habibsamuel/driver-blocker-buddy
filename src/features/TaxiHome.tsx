import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CarFront,
  ChevronDown,
  Clock3,
  Heart,
  Home,
  LocateFixed,
  LockKeyhole,
  MapPin,
  Menu,
  MessageCircle,
  Navigation,
  Phone,
  Search,
  Share2,
  ShieldCheck,
  Star,
  Users,
  Wifi,
  X,
} from "lucide-react";
import { toast } from "sonner";
import ecoTaxiAsset from "@/assets/taxi-proxi-eco.jpeg.asset.json";
import comfortTaxiAsset from "@/assets/taxi-proxi-confort.jpeg.asset.json";
import { TaxiMap, type MapMode } from "@/components/TaxiMap";
import { DestinationInput } from "@/components/DestinationInput";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/useGeolocation";
import { cn } from "@/lib/utils";

type Screen = "search" | "vehicle" | "trip";
type Vehicle = "standard" | "comfort";

const shortcuts = [
  { label: "Maison", detail: "Bastos", icon: Home },
  { label: "Poste Centrale", detail: "Centre-ville", icon: MapPin },
  { label: "Aéroport", detail: "Nsimalen", icon: Navigation },
];

const recentPlaces = [
  { name: "Bastos Ambassade USA", detail: "Bastos, Yaoundé", price: "1 500 XAF" },
  { name: "Aéroport Nsimalen", detail: "N2, Yaoundé", price: "7 000 XAF" },
  { name: "Carrefour Warda", detail: "Centre-ville", price: "1 000 XAF" },
];

const vehicleOptions = {
  standard: {
    name: "Taxi Eco",
    price: 500,
    eta: 3,
    badge: "Éco-accessible",
    image: ecoTaxiAsset.url,
    details: "4 places · Climatisé · Taxi Proxi",
  },
  comfort: {
    name: "Taxi Confort",
    price: 1000,
    eta: 5,
    badge: "★ Recommandé",
    image: comfortTaxiAsset.url,
    details: "Berline spacieuse · Wi-Fi · 5 étoiles",
  },
} as const;

export function TaxiHome() {
  const { position, error: geoError } = useGeolocation(true);
  const [screen, setScreen] = useState<Screen>("search");
  const [destination, setDestination] = useState("");
  const [vehicle, setVehicle] = useState<Vehicle>("comfort");
  const [menuOpen, setMenuOpen] = useState(false);
  const [recenterSignal, setRecenterSignal] = useState(0);
  const selected = vehicleOptions[vehicle];
  const mapMode: MapMode = screen;

  const arrivalTime = useMemo(() => {
    const date = new Date(Date.now() + 11 * 60_000);
    return date.toLocaleTimeString("fr-CM", { hour: "2-digit", minute: "2-digit" });
  }, [screen]);

  const chooseDestination = (value: string) => {
    setDestination(value);
    setScreen("vehicle");
  };

  const goToVehicle = () => {
    if (!destination.trim()) {
      toast.info("Choisissez d’abord votre destination");
      return;
    }
    setScreen("vehicle");
  };

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-map-canvas text-foreground">
      <TaxiMap position={position} recenterSignal={recenterSignal} mode={mapMode} />

      {screen === "search" && (
        <SearchScreen
          destination={destination}
          position={position}
          geoError={geoError}
          onDestinationChange={setDestination}
          onChooseDestination={chooseDestination}
          onContinue={goToVehicle}
          onOpenMenu={() => setMenuOpen(true)}
          onRecenter={() => setRecenterSignal((value) => value + 1)}
        />
      )}

      {screen === "vehicle" && (
        <VehicleScreen
          destination={destination || "Bastos VIP"}
          vehicle={vehicle}
          onVehicleChange={setVehicle}
          onBack={() => setScreen("search")}
          onConfirm={() => setScreen("trip")}
        />
      )}

      {screen === "trip" && (
        <TripScreen
          destination={destination || "Bastos VIP"}
          arrivalTime={arrivalTime}
          price={selected.price}
          onBack={() => setScreen("vehicle")}
        />
      )}

      <aside
        className={cn(
          "absolute inset-0 z-50 transition-colors duration-300",
          menuOpen ? "pointer-events-auto bg-overlay" : "pointer-events-none bg-transparent",
        )}
        aria-hidden={!menuOpen}
      >
        <div className={cn("h-full w-[82%] max-w-xs bg-surface p-5 shadow-2xl transition-transform duration-300", menuOpen ? "translate-x-0" : "-translate-x-full")}>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black">TAXI <span className="text-brand-strong">PROXI</span></span>
            <Button type="button" variant="ghost" size="icon" aria-label="Fermer le menu" onClick={() => setMenuOpen(false)} className="rounded-full"><X /></Button>
          </div>
          <div className="mt-8 rounded-3xl bg-secondary p-5 text-secondary-foreground">
            <p className="text-xs font-bold text-primary">YAOUNDÉ</p>
            <p className="mt-1 text-lg font-black">Votre taxi jaune, plus proche.</p>
          </div>
          <div className="mt-6 space-y-2 text-sm font-semibold text-muted-foreground">
            <p className="flex items-center gap-3 rounded-xl px-2 py-3"><ShieldCheck className="text-success" /> Courses sécurisées</p>
            <p className="flex items-center gap-3 rounded-xl px-2 py-3"><Clock3 className="text-primary" /> Disponible 24h/24</p>
          </div>
        </div>
      </aside>
    </main>
  );
}

function SearchScreen({
  destination,
  position,
  geoError,
  onDestinationChange,
  onChooseDestination,
  onContinue,
  onOpenMenu,
  onRecenter,
}: {
  destination: string;
  position: ReturnType<typeof useGeolocation>["position"];
  geoError: string | null;
  onDestinationChange: (value: string) => void;
  onChooseDestination: (value: string) => void;
  onContinue: () => void;
  onOpenMenu: () => void;
  onRecenter: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 animate-stage-in">
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Button type="button" variant="ghost" size="icon" aria-label="Ouvrir le menu" onClick={onOpenMenu} className="pointer-events-auto h-12 w-12 rounded-full border border-sheet-border bg-surface/95 shadow-map-control backdrop-blur-md hover:bg-surface"><Menu className="h-5 w-5" /></Button>
        <div className="pointer-events-auto flex h-11 items-center gap-2 rounded-full border border-sheet-border bg-surface/95 px-4 text-sm font-extrabold shadow-map-control backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-success" /> Yaoundé <span className="text-muted-foreground">· En direct</span>
        </div>
        <div className="flex h-11 items-center gap-1.5 rounded-full bg-secondary px-3 text-[11px] font-black text-secondary-foreground shadow-map-control"><LockKeyhole className="h-3.5 w-3.5 text-primary" /> Sécurisé</div>
      </header>

      <div className="absolute left-4 right-4 top-[5.8rem] flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
        {shortcuts.map((item) => {
          const Icon = item.icon;
          return <Button key={item.label} type="button" variant="ghost" onClick={() => onChooseDestination(`${item.label} (${item.detail})`)} className="h-10 shrink-0 rounded-full border border-sheet-border bg-surface/95 px-3 text-xs font-bold shadow-map-control hover:bg-surface"><Icon className="h-4 w-4 text-primary" />{item.label}</Button>;
        })}
      </div>

      <Button type="button" variant="ghost" size="icon" aria-label="Recentrer la carte" onClick={onRecenter} className="absolute right-4 top-36 h-12 w-12 rounded-full border border-sheet-border bg-surface text-foreground shadow-map-control hover:bg-surface"><LocateFixed className="h-5 w-5" /></Button>

      <section className="absolute inset-x-0 bottom-0 mx-auto max-h-[65dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-bottom-sheet">
        <div className="mx-auto mb-3 h-1 w-11 rounded-full bg-handle" />
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-black">Où allez-vous ?</h1>
          <Button type="button" variant="ghost" className="h-9 rounded-full bg-field px-3 text-xs font-extrabold">Maintenant <ChevronDown className="h-3.5 w-3.5" /></Button>
        </div>

        <div className="rounded-2xl border border-sheet-border bg-field p-1.5">
          <div className="flex min-h-10 items-center gap-3 border-b border-sheet-border px-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-success-soft"><span className="h-2.5 w-2.5 rounded-full bg-success" /></span>
            <p className="min-w-0 flex-1 truncate text-sm font-bold">{position ? "Ma position" : geoError ? "Localisation à activer" : "Localisation en cours…"}</p>
          </div>
          <div className="flex min-h-12 items-center gap-3 px-2">
            <MapPin className="h-5 w-5 fill-primary text-primary" />
            <DestinationInput value={destination} onChange={onDestinationChange} onSelect={onChooseDestination} position={position ? { lat: position.lat, lng: position.lng } : null} placeholder="Où allez-vous ?" className="flex-1 [&>svg]:hidden" inputClassName="h-11 border-0 bg-transparent pl-0 text-base font-bold shadow-none focus-visible:ring-0" />
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2" aria-label="Services de taxi disponibles">
          {[
            { label: "Taxi Eco", icon: CarFront, active: true },
            { label: "Taxi Confort", icon: Star },
            { label: "Réserver", icon: CalendarClock },
          ].map(({ label, icon: Icon, active }) => (
            <Button key={label} type="button" variant="ghost" className="h-[72px] min-w-0 flex-col gap-1 rounded-2xl px-1 hover:bg-field">
              <span className={cn("grid h-10 w-10 place-items-center rounded-full", active ? "bg-primary" : "bg-field")}><Icon className="h-5 w-5" /></span>
              <span className="max-w-full truncate text-[10px] font-extrabold">{label}</span>
            </Button>
          ))}
        </div>

        <div className="mt-3">
          <p className="mb-1 px-1 text-xs font-black uppercase text-muted-foreground">Destinations récentes</p>
          {recentPlaces.slice(0, 2).map((place) => (
            <Button key={place.name} type="button" variant="ghost" onClick={() => onChooseDestination(place.name)} className="h-12 w-full justify-start rounded-xl px-2 hover:bg-field">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-field"><MapPin className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1 text-left"><span className="block truncate text-xs font-extrabold">{place.name}</span><span className="block truncate text-[10px] text-muted-foreground">{place.detail}</span></span>
              <span className="text-xs font-black">{place.price}</span>
            </Button>
          ))}
        </div>

        <Button type="button" size="lg" disabled={!destination.trim()} onClick={onContinue} className="mt-3 h-14 w-full rounded-2xl text-base font-black shadow-cta transition-all duration-300 active:scale-[0.98]">Commander Taxi Proxi (~3 min) <ArrowRight /></Button>
      </section>
    </div>
  );
}

function VehicleScreen({ destination, vehicle, onVehicleChange, onBack, onConfirm }: { destination: string; vehicle: Vehicle; onVehicleChange: (vehicle: Vehicle) => void; onBack: () => void; onConfirm: () => void }) {
  const selected = vehicleOptions[vehicle];
  return (
    <div className="absolute inset-0 z-20 animate-stage-in">
      <div className="absolute inset-x-0 top-0 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3 rounded-2xl border border-sheet-border bg-surface/95 p-3 shadow-map-control backdrop-blur-md">
          <Button type="button" variant="ghost" size="icon" aria-label="Retour" onClick={onBack} className="h-10 w-10 rounded-full bg-field"><ArrowLeft /></Button>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-black">Poste Centrale <ArrowRight className="inline h-3 w-3" /> {destination}</p><p className="mt-0.5 text-xs font-semibold text-muted-foreground">4,2 km · 12 min</p></div>
          <span className="rounded-full bg-success-soft px-2.5 py-1 text-[10px] font-black text-success">Trafic fluide</span>
        </div>
      </div>

      <section className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-xl rounded-t-3xl bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-bottom-sheet">
        <div className="mx-auto mb-4 h-1 w-11 rounded-full bg-handle" />
        <div className="flex items-center justify-between"><h1 className="text-xl font-black">Choix du confort</h1><span className="rounded-full bg-primary-soft px-3 py-1 text-[10px] font-black text-brand-strong">Tarif garanti</span></div>
        <div className="mt-4 space-y-2.5" role="radiogroup" aria-label="Choix du véhicule">
          {(Object.keys(vehicleOptions) as Vehicle[]).map((id) => {
            const item = vehicleOptions[id];
            const active = vehicle === id;
            return (
              <Button key={id} type="button" variant="ghost" role="radio" aria-checked={active} onClick={() => onVehicleChange(id)} className={cn("h-[108px] w-full justify-start rounded-2xl border p-3 transition-all duration-300 hover:bg-field", active ? "border-primary bg-primary-soft shadow-vehicle" : "border-sheet-border bg-surface")}>
                <span className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-field">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </span>
                <span className="min-w-0 flex-1 text-left"><span className="flex items-center gap-2"><span className="text-sm font-black">{item.name}</span><span className={cn("rounded-full px-2 py-0.5 text-[8px] font-black", id === "standard" ? "bg-success-soft text-success" : "bg-secondary text-primary")}>{item.badge}</span></span><span className="mt-1 block text-[10px] font-semibold text-muted-foreground">{item.details}</span><span className="mt-1 block text-xs font-bold">~ {item.eta} min</span></span>
                <span className="text-base font-black">{item.price.toLocaleString("fr-FR")} FCFA</span>
              </Button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-field p-3">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-lg">💵</span><span><span className="block text-xs font-black">Espèces</span><span className="block text-[10px] text-muted-foreground">Paiement au chauffeur</span></span></div>
          <ShieldCheck className="h-5 w-5 text-success" />
        </div>

        <Button type="button" size="lg" onClick={onConfirm} className="mt-4 h-14 w-full rounded-2xl text-base font-black shadow-cta transition-all duration-300 active:scale-[0.98]">Confirmer {selected.name} · {selected.price.toLocaleString("fr-FR")} FCFA <ArrowRight /></Button>
      </section>
    </div>
  );
}

function TripScreen({ destination, arrivalTime, price, onBack }: { destination: string; arrivalTime: string; price: number; onBack: () => void }) {
  const shareTrip = async () => {
    const text = `Je suis en route vers ${destination} avec TAXI PROXI. Chauffeur : Alain M., Toyota Yaris CE-784-LT.`;
    if (navigator.share) await navigator.share({ title: "Ma course TAXI PROXI", text }).catch(() => undefined);
    else await navigator.clipboard?.writeText(text).then(() => toast.success("Trajet copié"));
  };

  return (
    <div className="absolute inset-0 z-20 animate-stage-in">
      <div className="absolute inset-x-0 top-0 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="rounded-2xl bg-secondary p-3 text-secondary-foreground shadow-map-control">
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="icon" aria-label="Retour" onClick={onBack} className="h-10 w-10 rounded-full bg-surface/10 text-secondary-foreground hover:bg-surface/20"><ArrowLeft /></Button>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-success text-success-foreground"><Navigation className="h-6 w-6 -rotate-45" /></span>
            <div className="min-w-0 flex-1"><p className="text-[10px] font-bold text-success">DANS 250 M</p><p className="truncate text-sm font-black">Tournez sur Avenue Kennedy</p></div>
            <div className="text-right"><p className="text-lg font-black text-primary">{arrivalTime}</p><p className="text-[10px] text-secondary-foreground/70">11 min · 3,8 km</p></div>
          </div>
          <p className="mt-2 border-t border-surface/15 pt-2 text-center text-[10px] font-bold text-success">Trafic très fluide sur Boulevard du 20 Mai</p>
        </div>
      </div>

      <div className="absolute left-1/2 top-[42%] -translate-x-1/2 rounded-full bg-secondary px-3 py-1 text-xs font-black text-primary shadow-map-control">48 km/h</div>

      <section className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-xl rounded-t-3xl bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-bottom-sheet">
        <div className="mx-auto mb-3 h-1 w-11 rounded-full bg-handle" />
        <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase text-success">Course en progression</p><h1 className="text-lg font-black">En route vers {destination}</h1></div><span className="text-sm font-black">65%</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-field"><div className="h-full w-[65%] rounded-full bg-success transition-[width] duration-300" /></div>

        <div className="mt-4 flex items-center gap-3">
          <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-secondary text-xl font-black text-primary">AM<span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-surface bg-success"><ShieldCheck className="h-3 w-3 text-success-foreground" /></span></div>
          <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><p className="font-black">Alain M.</p><span className="flex items-center gap-0.5 text-xs font-black">4,9 <Star className="h-3.5 w-3.5 fill-primary text-primary" /></span></div><p className="truncate text-xs font-semibold text-muted-foreground">Toyota Yaris · CE-784-LT</p><p className="mt-0.5 text-[10px] font-bold text-success">Chauffeur vérifié · Badge CUY</p></div>
          <div className="text-right"><p className="text-base font-black">{price.toLocaleString("fr-FR")}</p><p className="text-[10px] font-bold text-muted-foreground">FCFA · Espèces</p></div>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_1fr_2.2fr_1fr] gap-2">
          <Button type="button" variant="ghost" aria-label="Appeler Alain" onClick={() => toast.info("Appel du chauffeur…")} className="h-12 min-w-0 flex-col gap-0.5 rounded-xl bg-field px-1 text-[9px] font-bold"><Phone className="h-4 w-4" />Appeler</Button>
          <Button type="button" variant="ghost" aria-label="Envoyer un message" onClick={() => toast.info("Messagerie ouverte")} className="h-12 min-w-0 flex-col gap-0.5 rounded-xl bg-field px-1 text-[9px] font-bold"><MessageCircle className="h-4 w-4" />Message</Button>
          <Button type="button" onClick={shareTrip} className="h-12 min-w-0 rounded-xl bg-success px-2 text-[10px] font-black text-success-foreground hover:bg-success/90"><Share2 className="h-4 w-4" />Partager mon trajet</Button>
          <Button type="button" variant="destructive" aria-label="Urgence SOS" onClick={() => toast.error("Assistance d’urgence ouverte")} className="h-12 min-w-0 rounded-xl px-1 text-xs font-black">SOS</Button>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground"><Heart className="h-3.5 w-3.5 text-success" /> Suivi sécurisé en temps réel par TAXI PROXI</div>
      </section>
    </div>
  );
}