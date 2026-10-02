import { useState } from "react";
import { Bike, CarFront, ChevronDown, LocateFixed, MapPin, Menu, Search, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { TaxiMap } from "@/components/TaxiMap";
import { DestinationInput } from "@/components/DestinationInput";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/useGeolocation";
import { cn } from "@/lib/utils";

type Vehicle = "moto" | "eco" | "confort";

const vehicles: Array<{ id: Vehicle; name: string; price: string; eta: string; icon: typeof CarFront }> = [
  { id: "moto", name: "Moto", price: "150 F", eta: "2 min", icon: Bike },
  { id: "eco", name: "Eco", price: "500 F", eta: "4 min", icon: CarFront },
  { id: "confort", name: "Confort", price: "1 000 F", eta: "6 min", icon: Sparkles },
];

export function TaxiHome() {
  const { position, error: geoError } = useGeolocation(true);
  const [destination, setDestination] = useState("");
  const [vehicle, setVehicle] = useState<Vehicle>("eco");
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [recenterSignal, setRecenterSignal] = useState(0);

  const selected = vehicles.find((item) => item.id === vehicle) ?? vehicles[1];

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-map-canvas text-foreground">
      <TaxiMap position={position} recenterSignal={recenterSignal} />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Ouvrir le menu"
          onClick={() => setMenuOpen(true)}
          className="pointer-events-auto h-12 w-12 rounded-full border border-sheet-border bg-surface/95 text-foreground shadow-map-control backdrop-blur-md hover:bg-surface"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="pointer-events-auto h-11 rounded-full border border-sheet-border bg-surface/95 px-4 font-extrabold text-foreground shadow-map-control backdrop-blur-md hover:bg-surface"
        >
          Yaoundé <ChevronDown className="h-4 w-4" />
        </Button>
        <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-xs font-black text-primary shadow-map-control" aria-label="Taxi Proxi">
          TP
        </div>
      </header>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Recentrer la carte"
        onClick={() => setRecenterSignal((value) => value + 1)}
        className="absolute right-4 top-24 z-20 h-12 w-12 rounded-full border border-sheet-border bg-surface text-foreground shadow-map-control hover:bg-surface"
      >
        <LocateFixed className="h-5 w-5" />
      </Button>

      <section
        className={cn(
          "absolute inset-x-0 bottom-0 z-30 mx-auto w-full max-w-xl rounded-t-[28px] bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-bottom-sheet transition-[max-height] duration-500 ease-out",
          expanded ? "max-h-[88dvh] overflow-y-auto" : "max-h-[57dvh]",
        )}
      >
        <Button
          type="button"
          variant="ghost"
          aria-label={expanded ? "Réduire le panneau" : "Agrandir le panneau"}
          onClick={() => setExpanded((value) => !value)}
          className="mx-auto mb-2 flex h-5 w-20 p-0 hover:bg-transparent"
        >
          <span className="h-1 w-11 rounded-full bg-handle" />
        </Button>

        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase text-muted-foreground">Déplacez-vous avec</p>
            <h1 className="text-[24px] font-black leading-tight text-foreground">TAXI <span className="text-brand-strong">PROXI</span></h1>
          </div>
          <span className="rounded-full bg-success-soft px-3 py-1.5 text-[11px] font-extrabold text-success">Disponible 24/7</span>
        </div>

        <div className="rounded-2xl bg-field p-2">
          <div className="flex min-h-12 items-center gap-3 border-b border-sheet-border px-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-success-soft"><span className="h-2.5 w-2.5 rounded-full bg-success" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-muted-foreground">DÉPART</p>
              <p className="truncate text-sm font-bold text-foreground">{position ? "Ma position" : geoError ? "Localisation à activer" : "Localisation en cours…"}</p>
            </div>
          </div>
          <div className="flex min-h-14 items-center gap-3 px-2">
            <span className="grid h-6 w-6 place-items-center"><MapPin className="h-5 w-5 fill-primary text-primary" /></span>
            <DestinationInput
              value={destination}
              onChange={setDestination}
              onSelect={() => setExpanded(true)}
              position={position ? { lat: position.lat, lng: position.lng } : null}
              placeholder="Où allez-vous ?"
              className="flex-1 [&>svg]:hidden"
              inputClassName="h-12 border-0 bg-transparent pl-0 text-base font-bold text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0 [&+svg]:hidden"
            />
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Type de véhicule">
          {vehicles.map((item) => {
            const Icon = item.icon;
            const active = vehicle === item.id;
            return (
              <Button
                key={item.id}
                type="button"
                variant="ghost"
                role="radio"
                aria-checked={active}
                onClick={() => setVehicle(item.id)}
                className={cn(
                  "relative h-[105px] min-w-0 flex-col gap-1 rounded-2xl border px-2 py-2 text-foreground transition-all hover:bg-field",
                  active ? "border-primary bg-primary-soft shadow-vehicle" : "border-sheet-border bg-surface",
                )}
              >
                {item.id === "eco" && <span className="absolute -top-2 rounded-full bg-secondary px-2 py-0.5 text-[8px] font-black text-primary">POPULAIRE</span>}
                <span className={cn("grid h-9 w-12 place-items-center rounded-xl", active ? "bg-primary" : "bg-field")}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-xs font-extrabold">{item.name}</span>
                <span className="text-sm font-black">{item.price}</span>
                <span className="text-[9px] font-semibold text-muted-foreground">~ {item.eta}</span>
              </Button>
            );
          })}
        </div>

        <Button
          type="button"
          size="lg"
          disabled={!destination.trim()}
          onClick={() => toast.success(`${selected.name} commandé — paiement en espèces`)}
          className="mt-4 h-14 w-full rounded-2xl bg-primary text-base font-black text-primary-foreground shadow-cta hover:bg-brand-strong active:scale-[0.98]"
        >
          Commander Taxi Proxi · {selected.price}
        </Button>
      </section>

      <aside className={cn("absolute inset-0 z-50 transition", menuOpen ? "pointer-events-auto bg-overlay" : "pointer-events-none bg-transparent")} aria-hidden={!menuOpen}>
        <div className={cn("h-full w-[82%] max-w-xs bg-surface p-5 shadow-2xl transition-transform duration-300", menuOpen ? "translate-x-0" : "-translate-x-full")}>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black">TAXI <span className="text-brand-strong">PROXI</span></span>
            <Button type="button" variant="ghost" size="icon" aria-label="Fermer le menu" onClick={() => setMenuOpen(false)} className="rounded-full"><X /></Button>
          </div>
          <div className="mt-8 rounded-2xl bg-secondary p-5 text-secondary-foreground">
            <p className="text-xs font-bold text-primary">YAOUNDÉ</p>
            <p className="mt-1 text-lg font-black">Votre taxi jaune, plus proche.</p>
          </div>
          <p className="mt-6 text-sm leading-6 text-muted-foreground">Courses sécurisées, chauffeurs locaux et paiement en espèces.</p>
        </div>
      </aside>
    </main>
  );
}
