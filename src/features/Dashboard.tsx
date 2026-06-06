import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapView } from "@/components/MapView";
import { useDriverPositions } from "@/hooks/useDriverPositions";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAuth } from "@/hooks/useAuth";
import { useDriverBroadcast } from "@/hooks/useDriverBroadcast";
import {
  Search,
  MapPin,
  Navigation,
  Car,
  Users,
  Wallet,
  AlertTriangle,
  Clock,
  TrendingUp,
} from "lucide-react";

export function Dashboard() {
  const { drivers, clients, rides, checkAndBlockDrivers, seedDemo } = useStore();
  const { user, roles, isOnlineDriver } = useAuth();
  const [query, setQuery] = useState("");

  useEffect(() => {
    checkAndBlockDrivers();
    if (drivers.length === 0) seedDemo();
  }, [checkAndBlockDrivers, drivers.length, seedDemo]);

  // Real-time positions from DB
  const liveDrivers = useDriverPositions();
  // Geolocate this device when signed in
  const { position: myPos } = useGeolocation(!!user);
  // Broadcast position if I'm a chauffeur and online
  useDriverBroadcast({
    enabled: isOnlineDriver && roles.includes("chauffeur"),
    userId: user?.id ?? null,
    position: myPos,
  });

  const totalRevenue = rides.filter((r) => r.paid).reduce((s, r) => s + r.total, 0);
  const ongoing = rides.filter((r) => !r.paid).length;
  const active = liveDrivers.length;
  const blocked = drivers.filter((d) => d.blocked);

  return (
    <div className="space-y-4">
      {/* Map + search overlay (Yango style) */}
      <div className="relative h-[420px] sm:h-[480px] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-yellow-400/20">
        <MapView drivers={liveDrivers} me={myPos ? { lat: myPos.lat, lng: myPos.lng } : null} className="absolute inset-0" />

        {/* Top search overlay */}
        <div className="absolute top-3 left-3 right-3 z-10">
          <div className="bg-black/85 backdrop-blur-md rounded-xl p-2 flex items-center gap-2 shadow-xl ring-1 ring-yellow-400/30">
            <div className="bg-yellow-400 text-black rounded-lg p-2">
              <Search className="h-4 w-4" />
            </div>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Où allez-vous ?"
              className="border-0 bg-transparent text-white placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Link to="/course">
              <Button size="sm" className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold">
                Aller
              </Button>
            </Link>
          </div>
        </div>

        {/* Floating live count */}
        <div className="absolute bottom-3 left-3 z-10 bg-black/85 backdrop-blur-md text-white rounded-xl px-3 py-2 text-xs flex items-center gap-2 ring-1 ring-yellow-400/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400" />
          </span>
          <span className="font-semibold">{active}</span> chauffeurs en ligne
        </div>

        {/* Quick action button */}
        <Link
          to="/course"
          className="absolute bottom-3 right-3 z-10 bg-yellow-400 hover:bg-yellow-300 text-black rounded-full shadow-2xl px-4 py-3 flex items-center gap-2 font-bold transition-transform hover:scale-105"
        >
          <Navigation className="h-4 w-4" />
          Commander
        </Link>

        {drivers.length === 0 && (
          <div className="absolute inset-x-3 bottom-16 z-10 bg-black/90 text-white p-3 rounded-xl text-sm flex items-center justify-between ring-1 ring-yellow-400/40">
            <span>Aucune donnée — chargez la démo pour voir des chauffeurs.</span>
            <Button size="sm" onClick={seedDemo} className="bg-yellow-400 text-black hover:bg-yellow-300">
              Démo
            </Button>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Car} label="Courses actives" value={String(ongoing)} />
        <Stat icon={Users} label="Chauffeurs" value={`${active}/${drivers.length}`} />
        <Stat icon={Wallet} label="Encaissé" value={`${totalRevenue.toLocaleString()} XAF`} />
        <Stat icon={TrendingUp} label="Clients" value={String(clients.length)} />
      </div>

      {/* Alerts + nearby drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-zinc-950 text-white rounded-2xl p-4 ring-1 ring-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <h2 className="font-bold">Alertes</h2>
          </div>
          {blocked.length === 0 ? (
            <p className="text-sm text-zinc-400">Aucun chauffeur bloqué ✅</p>
          ) : (
            <ul className="space-y-2">
              {blocked.map((d) => (
                <li key={d.id} className="flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-zinc-400">{d.clientsThisMonth} clients</p>
                  </div>
                  <Badge variant="destructive">Bloqué</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-zinc-950 text-white rounded-2xl p-4 ring-1 ring-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-yellow-400" />
            <h2 className="font-bold">Chauffeurs à proximité</h2>
          </div>
          {drivers.length === 0 ? (
            <p className="text-sm text-zinc-400">Aucun chauffeur</p>
          ) : (
            <ul className="space-y-2 max-h-56 overflow-auto">
              {drivers.slice(0, 6).map((d) => (
                <li key={d.id} className="flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${d.blocked ? "bg-red-500" : "bg-yellow-400"}`} />
                    <div>
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-zinc-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {d.zone}
                      </p>
                    </div>
                  </div>
                  <Badge className={d.blocked ? "bg-red-500" : "bg-yellow-400 text-black hover:bg-yellow-300"}>
                    {d.blocked ? "Hors-ligne" : "En ligne"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-zinc-950 text-white rounded-2xl p-4 ring-1 ring-zinc-800 hover:ring-yellow-400/40 transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</p>
          <p className="text-xl font-black mt-1">{value}</p>
        </div>
        <div className="bg-yellow-400/10 text-yellow-400 rounded-xl p-2">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
