import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Star, Clock, Car } from "lucide-react";

const COLORS = [
  { name: "Blanc", hex: "#f8fafc" },
  { name: "Noir", hex: "#111827" },
  { name: "Gris", hex: "#9ca3af" },
  { name: "Bleu", hex: "#2563eb" },
  { name: "Rouge", hex: "#dc2626" },
  { name: "Vert", hex: "#16a34a" },
];

/** Couleur du véhicule déterministe (basée sur la plaque) si non renseignée. */
export function vehicleColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
  return COLORS[h % COLORS.length];
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/**
 * Fiche d'information du chauffeur affichée en bas de l'écran client
 * dès que la course est acceptée.
 */
export function DriverInfoCard({
  name,
  phone,
  plate,
  vehicle,
  photoUrl,
  rating,
  etaMin,
  colorName,
}: {
  name: string;
  phone: string;
  plate?: string;
  vehicle?: string;
  photoUrl?: string;
  rating?: number;
  etaMin?: number | null;
  colorName?: string;
}) {
  const color = vehicleColor(plate || name);
  const label = colorName ?? color.name;

  return (
    <div className="rounded-2xl border-2 border-primary/40 bg-card p-4 shadow-lg space-y-4">
      <div className="flex items-center gap-3">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`Photo de ${name}`}
            loading="lazy"
            className="h-16 w-16 rounded-full object-cover border-2 border-primary"
          />
        ) : (
          <div className="h-16 w-16 rounded-full border-2 border-primary bg-primary/15 text-primary flex items-center justify-center text-xl font-bold">
            {initials(name) || "🚖"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-bold text-lg leading-tight truncate">{name}</p>
          {typeof rating === "number" && rating > 0 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Star className="h-3 w-3 fill-primary text-primary" /> {rating.toFixed(1)}
            </p>
          )}
          <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
            <Car className="h-3.5 w-3.5" /> {vehicle ?? "Véhicule"} ·{" "}
            <span className="inline-flex items-center gap-1">
              <span
                className="inline-block h-3 w-3 rounded-full border border-border"
                style={{ backgroundColor: color.hex }}
              />
              {label}
            </span>
          </p>
        </div>
        <a href={`tel:${phone}`} aria-label={`Appeler ${name}`}>
          <Button size="icon" className="rounded-full h-11 w-11">
            <Phone className="h-5 w-5" />
          </Button>
        </a>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-muted/50 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Immatriculation</p>
          <p className="font-mono font-bold text-base tracking-widest">{plate ?? "—"}</p>
        </div>
        <div className="rounded-xl bg-primary/10 border border-primary/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> Arrivée estimée
          </p>
          <p className="font-bold text-base">
            {typeof etaMin === "number" ? `${etaMin} min` : "Calcul…"}
          </p>
        </div>
      </div>

      <Badge variant="outline" className="w-full justify-center py-1.5">
        💵 Paiement en liquide au chauffeur
      </Badge>
    </div>
  );
}
