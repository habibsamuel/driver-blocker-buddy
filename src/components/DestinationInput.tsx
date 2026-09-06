import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { suggestPlaces, type PlaceSuggestion } from "@/lib/places.functions";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Champ destination avec suggestions de lieux proches (repères, quartiers, rues)
 * dès les premières lettres saisies.
 */
export function DestinationInput({
  value,
  onChange,
  onSelect,
  position,
  placeholder = "Ex: Aéroport Nsimalen, Bastos, Mvog-Mbi…",
  className,
  inputClassName,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (v: string) => void;
  position?: { lat: number; lng: number } | null;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}) {
  const suggest = useServerFn(suggestPlaces);
  const [items, setItems] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const skipRef = useRef(false);

  useEffect(() => {
    const q = value.trim();
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }
    if (q.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const r = await suggest({
          data: {
            query: q,
            ...(position ? { lat: position.lat, lng: position.lng } : {}),
          },
        });
        if (cancelled) return;
        setItems(r.suggestions);
        setOpen(r.suggestions.length > 0);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, position?.lat, position?.lng, suggest]);

  const pick = (s: PlaceSuggestion) => {
    const full = s.secondary ? `${s.label}, ${s.secondary}` : s.label;
    skipRef.current = true;
    setOpen(false);
    setItems([]);
    onChange(full);
    onSelect?.(full);
  };

  return (
    <div className={cn("relative", className)}>
      <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => items.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className={cn("pl-9", inputClassName)}
        autoComplete="off"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
      {open && items.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border bg-popover shadow-lg">
          {items.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-accent transition"
              >
                <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium truncate">{s.label}</span>
                  {s.secondary && (
                    <span className="block text-xs text-muted-foreground truncate">{s.secondary}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
