import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { ArrowLeft, ArrowRight, ArrowUp, CornerUpLeft, CornerUpRight, Flag, Navigation, RotateCw, Square, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LngLat = [number, number];
const YAOUNDE: LngLat = [11.52, 3.86];

type Step = {
  instruction: string;
  modifier?: string;
  type: string;
  location: LngLat;
  distance: number;
  voice: { distanceAlongGeometry: number; announcement: string }[];
};

function fmtDist(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1).replace(".", ",")} km` : `${Math.max(10, Math.round(m / 10) * 10)} m`;
}

function haversine(a: LngLat, b: LngLat) {
  const R = 6371000, toR = Math.PI / 180;
  const dLat = (b[1] - a[1]) * toR, dLng = (b[0] - a[0]) * toR;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * toR) * Math.cos(b[1] * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function ManeuverIcon({ type, modifier }: { type: string; modifier?: string }) {
  const cls = "h-12 w-12";
  if (type === "arrive") return <Flag className={cls} />;
  if (type === "roundabout" || type === "rotary") return <RotateCw className={cls} />;
  if (modifier?.includes("sharp left") || modifier === "left") return <CornerUpLeft className={cls} />;
  if (modifier?.includes("sharp right") || modifier === "right") return <CornerUpRight className={cls} />;
  if (modifier === "slight left") return <ArrowLeft className={cls} />;
  if (modifier === "slight right") return <ArrowRight className={cls} />;
  return <ArrowUp className={cls} />;
}

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "fr-FR";
  const fr = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("fr"));
  if (fr) u.voice = fr;
  window.speechSynthesis.speak(u);
}

export function TurnByTurnNav() {
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
  const taxiRef = useRef<import("mapbox-gl").Marker | null>(null);
  const mbRef = useRef<typeof import("mapbox-gl").default | null>(null);
  const watchRef = useRef<number | null>(null);
  const stepsRef = useRef<Step[]>([]);
  const spokenRef = useRef<Set<string>>(new Set());
  const mutedRef = useRef(false);

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [taxiPos, setTaxiPos] = useState<LngLat | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [toManeuver, setToManeuver] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // Carte
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled || !container.current) return;
      mbRef.current = mapboxgl;
      mapboxgl.accessToken = token;
      mapRef.current = new mapboxgl.Map({
        container: container.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: YAOUNDE,
        zoom: 13,
        attributionControl: false,
      });
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [token]);

  // Position du taxi en temps réel
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (p) => setTaxiPos([p.coords.longitude, p.coords.latitude]),
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );
    return () => { if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current); };
  }, []);

  // Marqueur taxi + progression
  useEffect(() => {
    const map = mapRef.current, mb = mbRef.current;
    if (!map || !mb || !taxiPos) return;
    if (!taxiRef.current) {
      const el = document.createElement("div");
      el.className = "h-5 w-5 rounded-full border-4 border-background bg-primary shadow-lg";
      taxiRef.current = new mb.Marker({ element: el }).setLngLat(taxiPos).addTo(map);
    } else taxiRef.current.setLngLat(taxiPos);

    if (!navigating) return;
    map.easeTo({ center: taxiPos, zoom: 16, pitch: 50, duration: 800 });
    const all = stepsRef.current;
    let idx = stepIdx;
    let next = all[idx + 1];
    // Passe à l'étape suivante si on est à moins de 20 m de la manœuvre
    while (next && haversine(taxiPos, next.location) < 20) { idx++; next = all[idx + 1]; }
    if (idx !== stepIdx) setStepIdx(idx);
    const dist = next ? haversine(taxiPos, next.location) : 0;
    setToManeuver(dist);
    setRemaining(dist + all.slice(idx + 1).reduce((s, x) => s + x.distance, 0));
    // Annonces vocales de l'étape en cours
    all[idx]?.voice.forEach((v, i) => {
      const key = `${idx}-${i}`;
      if (!spokenRef.current.has(key) && dist <= v.distanceAlongGeometry + 15) {
        spokenRef.current.add(key);
        if (!mutedRef.current) speak(v.announcement);
      }
    });
    if (!next && all.length) {
      setNavigating(false);
      if (!mutedRef.current) speak("Vous êtes arrivé à destination.");
    }
  }, [taxiPos, navigating]); // eslint-disable-line react-hooks/exhaustive-deps

  async function geocode(q: string): Promise<LngLat> {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?proximity=${YAOUNDE.join(",")}&country=cm&language=fr&limit=1&access_token=${token}`;
    const r = await fetch(url);
    const j = await r.json();
    if (!j.features?.length) throw new Error(`Adresse introuvable : ${q}`);
    return j.features[0].center as LngLat;
  }

  async function start() {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const from = origin.trim() ? await geocode(origin) : taxiPos;
      if (!from) throw new Error("Position du taxi inconnue : saisissez un départ.");
      if (!destination.trim()) throw new Error("Saisissez la destination du client.");
      const to = await geocode(destination);
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${from.join(",")};${to.join(",")}?steps=true&geometries=geojson&overview=full&language=fr&voice_instructions=true&banner_instructions=true&voice_units=metric&access_token=${token}`;
      const r = await fetch(url);
      const j = await r.json();
      if (!r.ok || !j.routes?.length) throw new Error(j.message || "Aucun itinéraire trouvé");
      const route = j.routes[0];
      const parsed: Step[] = route.legs[0].steps.map((s: any) => ({
        instruction: s.bannerInstructions?.[0]?.primary?.text
          ? `${s.maneuver.instruction}`
          : s.maneuver.instruction,
        modifier: s.maneuver.modifier,
        type: s.maneuver.type,
        location: s.maneuver.location,
        distance: s.distance,
        voice: (s.voiceInstructions ?? []).map((v: any) => ({ distanceAlongGeometry: v.distanceAlongGeometry, announcement: v.announcement })),
      }));
      stepsRef.current = parsed;
      spokenRef.current = new Set();
      setSteps(parsed);
      setStepIdx(0);
      setToManeuver(parsed[1] ? haversine(from, parsed[1].location) : 0);
      setRemaining(route.distance);

      const map = mapRef.current!;
      const data = { type: "Feature" as const, properties: {}, geometry: route.geometry };
      const src = map.getSource("nav-route") as import("mapbox-gl").GeoJSONSource | undefined;
      if (src) src.setData(data);
      else {
        map.addSource("nav-route", { type: "geojson", data });
        map.addLayer({ id: "nav-route-casing", type: "line", source: "nav-route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#0B3D91", "line-width": 12 } });
        map.addLayer({ id: "nav-route-line", type: "line", source: "nav-route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#2F80FF", "line-width": 7 } });
      }
      const mb = mbRef.current!;
      const bounds = new mb.LngLatBounds(from, from);
      route.geometry.coordinates.forEach((c: LngLat) => bounds.extend(c));
      map.fitBounds(bounds, { padding: { top: 200, bottom: 260, left: 40, right: 40 }, duration: 800 });
      setNavigating(true);
      if (!mutedRef.current) speak(parsed[0].voice[0]?.announcement ?? parsed[0].instruction);
      spokenRef.current.add("0-0");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de navigation");
    } finally {
      setLoading(false);
    }
  }

  function stop() {
    setNavigating(false);
    window.speechSynthesis?.cancel();
    mapRef.current?.easeTo({ pitch: 0, zoom: 13 });
  }

  const nextStep = steps[stepIdx + 1] ?? steps[stepIdx];
  const minutes = Math.max(1, Math.round(remaining / 1000 / 0.4));

  return (
    <main className="nav-dark relative h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      <div ref={container} className="absolute inset-0" aria-label="Carte de navigation Yaoundé" />
      {!token && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted-foreground">
          Ajoutez votre clé Mapbox (VITE_MAPBOX_TOKEN) pour afficher la carte.
        </div>
      )}

      {navigating && nextStep && (
        <header className="absolute inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 mx-auto max-w-xl animate-stage-in rounded-3xl bg-card p-4 shadow-2xl">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <ManeuverIcon type={nextStep.type} modifier={nextStep.modifier} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-3xl font-black text-primary">{fmtDist(toManeuver)}</p>
              <p className="text-lg font-bold leading-tight">Dans {fmtDist(toManeuver)}, {nextStep.instruction.charAt(0).toLowerCase() + nextStep.instruction.slice(1)}</p>
            </div>
            <Button size="icon" variant="ghost" aria-label={muted ? "Activer la voix" : "Couper la voix"} onClick={() => setMuted((m) => !m)} className="rounded-full bg-muted">
              {muted ? <VolumeX /> : <Volume2 />}
            </Button>
          </div>
          <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-bold text-muted-foreground">
            <span>Restant : <span className="text-foreground">{fmtDist(remaining)}</span></span>
            <span>~ <span className="text-foreground">{minutes} min</span></span>
          </div>
        </header>
      )}

      <section className="absolute inset-x-0 bottom-0 z-20 mx-auto w-full max-w-xl rounded-t-3xl bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl">
        {!navigating ? (
          <div className="space-y-3 animate-stage-in">
            <h1 className="text-xl font-black">Navigation <span className="text-primary">TAXI PROXI</span></h1>
            <div className="space-y-2 rounded-2xl bg-muted p-2">
              <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder={taxiPos ? "Départ : position du taxi (GPS)" : "Point de départ (taxi)"} className="h-12 border-0 bg-background text-base" />
              <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Destination du client" className="h-12 border-0 bg-background text-base" />
            </div>
            {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
            <Button size="lg" disabled={loading || !token} onClick={start} className="h-14 w-full rounded-2xl text-base font-black">
              <Navigation /> {loading ? "Calcul de l’itinéraire…" : "Démarrer"}
            </Button>
          </div>
        ) : (
          <Button size="lg" variant="destructive" onClick={stop} className="h-14 w-full rounded-2xl text-base font-black">
            <Square /> Arrêter la navigation
          </Button>
        )}
      </section>
    </main>
  );
}
