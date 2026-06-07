import { create } from "zustand";
import { persist } from "zustand/middleware";

export type VehicleClass = "eco" | "confort" | "moto";

export type Driver = {
  id: string;
  name: string;
  phone: string;
  zone: string;
  vehicle?: string;          // model
  plate?: string;            // license plate
  vehicleClass: VehicleClass;
  accessPin: string;         // 4-digit code defined at signup, required to access chauffeur area
  rating: number;            // 0..5 average
  ratingsCount: number;
  clientsThisMonth: number;
  subscriptionPaid: boolean;
  blocked: boolean;
  thresholdReachedAt: string | null;
  createdAt: string;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  quartier: string;
  createdAt: string;
};

export type RideStatus = "pending" | "ongoing" | "completed" | "cancelled";

export type Ride = {
  id: string;
  driverId: string;
  clientId: string;
  from: string;
  to: string;
  distanceKm: number;
  durationMin: number;
  baseFare: number;
  timeSurcharge: number;
  waitMin: number;
  waitSurcharge: number;
  peakMultiplier: number;
  vehicleClass: VehicleClass;
  classMultiplier: number;
  promoCode?: string;
  promoDiscount?: number;
  total: number;
  paid: boolean;
  status: RideStatus;
  startPin: string;          // 4-digit code shown to client; driver enters to start
  shareToken: string;        // for trip-sharing URL
  driverRating?: number;     // 1..5 given by client
  ratingComment?: string;
  createdAt: string;
  completedAt?: string;
};

export type UnlockCode = {
  id: string;
  driverId: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
};

export type PromoCode = {
  code: string;
  percentOff: number; // 0..100
  active: boolean;
};

type Settings = {
  pricePerKm: number;
  pricePerMin: number;
  minFare: number;
  maxFare: number;
  waitSurchargePer5min: number;
  peakHourPct: number;
  nightPct: number;
  threshold1: number;
  threshold2: number;
  subscription1: number;
  subscription2: number;
  graceHours: number;
  paymentNumber: string;
  adminPin: string;
  emergencyNumber: string;
  supportNumber: string;
  classMultipliers: Record<VehicleClass, number>;
};

export type Role = "client" | "chauffeur" | "admin";

type State = {
  drivers: Driver[];
  clients: Client[];
  rides: Ride[];
  codes: UnlockCode[];
  promos: PromoCode[];
  settings: Settings;
  role: Role;
  trustedContact: string; // phone of trusted contact for safety
  setTrustedContact: (v: string) => void;
  setRole: (r: Role) => void;
  addDriver: (d: Omit<Driver, "id" | "clientsThisMonth" | "subscriptionPaid" | "blocked" | "thresholdReachedAt" | "createdAt" | "rating" | "ratingsCount" | "vehicleClass"> & { vehicleClass?: VehicleClass }) => void;
  updateDriver: (id: string, patch: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;
  addClient: (c: Omit<Client, "id" | "createdAt">) => Client;
  deleteClient: (id: string) => void;
  addRide: (r: Omit<Ride, "id" | "createdAt" | "paid" | "status" | "startPin" | "shareToken">) => Ride | null;
  startRide: (id: string, pin: string) => { ok: boolean; msg: string };
  completeRide: (id: string) => void;
  cancelRide: (id: string) => void;
  rateRide: (id: string, stars: number, comment?: string) => void;
  markRidePaid: (id: string) => void;
  generateUnlockCode: (driverId: string) => UnlockCode | null;
  redeemCode: (driverId: string, code: string) => { ok: boolean; msg: string };
  applyPromo: (code: string, amount: number) => { ok: boolean; discount: number; msg: string };
  resetMonthlyCounters: () => void;
  checkAndBlockDrivers: () => void;
  updateSettings: (s: Partial<Settings>) => void;
  seedDemo: () => void;
};

interface RngCrypto {
  randomUUID?: () => string;
  getRandomValues: <T extends ArrayBufferView>(arr: T) => T;
}
const _crypto = (globalThis as unknown as { crypto: RngCrypto }).crypto;

const uid = () => {
  if (_crypto.randomUUID) return _crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  const arr = new Uint8Array(8);
  _crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 10);
};

const secureCode6 = () => {
  const arr = new Uint32Array(1);
  _crypto.getRandomValues(arr);
  return ((arr[0] % 900000) + 100000).toString();
};

const securePin4 = () => {
  const arr = new Uint32Array(1);
  _crypto.getRandomValues(arr);
  return ((arr[0] % 9000) + 1000).toString();
};

const defaultSettings: Settings = {
  pricePerKm: 100,
  pricePerMin: 5,
  minFare: 750,
  maxFare: 3000,
  waitSurchargePer5min: 50,
  peakHourPct: 0.1,
  nightPct: 0.2,
  threshold1: 10,
  threshold2: 20,
  subscription1: 500,
  subscription2: 1000,
  graceHours: 48,
  paymentNumber: "694 839 546",
  adminPin: "2468",
  emergencyNumber: "117",       // Cameroun Police
  supportNumber: "+237694839546",
  classMultipliers: { eco: 1, confort: 1.3, moto: 0.7 },
};

const defaultPromos: PromoCode[] = [
  { code: "BIENVENUE", percentOff: 30, active: true },
  { code: "PROXI10", percentOff: 10, active: true },
];

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      drivers: [],
      clients: [],
      rides: [],
      codes: [],
      promos: defaultPromos,
      settings: defaultSettings,
      role: "client",
      trustedContact: "",
      setTrustedContact: (v) => set({ trustedContact: v }),
      setRole: (r) => set({ role: r }),

      addDriver: (d) =>
        set((s) => ({
          drivers: [
            ...s.drivers,
            {
              ...d,
              vehicleClass: d.vehicleClass ?? "eco",
              rating: 0,
              ratingsCount: 0,
              id: uid(),
              clientsThisMonth: 0,
              subscriptionPaid: false,
              blocked: false,
              thresholdReachedAt: null,
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateDriver: (id, patch) =>
        set((s) => ({ drivers: s.drivers.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),

      deleteDriver: (id) => set((s) => ({ drivers: s.drivers.filter((d) => d.id !== id) })),

      addClient: (c) => {
        const cl: Client = { ...c, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ clients: [...s.clients, cl] }));
        return cl;
      },

      deleteClient: (id) => set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),

      addRide: (r) => {
        const driver = get().drivers.find((d) => d.id === r.driverId);
        if (!driver) return null;
        if (driver.blocked) return null;
        const ride: Ride = {
          ...r,
          id: uid(),
          paid: false,
          status: "pending",
          startPin: securePin4(),
          shareToken: uid(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ rides: [ride, ...s.rides] }));
        const newCount = driver.clientsThisMonth + 1;
        const { threshold1 } = get().settings;
        let thresholdReachedAt = driver.thresholdReachedAt;
        if (!thresholdReachedAt && newCount >= threshold1) {
          thresholdReachedAt = new Date().toISOString();
        }
        get().updateDriver(driver.id, { clientsThisMonth: newCount, thresholdReachedAt });
        get().checkAndBlockDrivers();
        return ride;
      },

      startRide: (id, pin) => {
        const ride = get().rides.find((r) => r.id === id);
        if (!ride) return { ok: false, msg: "Course introuvable" };
        if (ride.startPin !== pin) return { ok: false, msg: "PIN incorrect" };
        set((s) => ({ rides: s.rides.map((r) => (r.id === id ? { ...r, status: "ongoing" } : r)) }));
        return { ok: true, msg: "Course démarrée" };
      },

      completeRide: (id) =>
        set((s) => ({
          rides: s.rides.map((r) =>
            r.id === id ? { ...r, status: "completed", completedAt: new Date().toISOString() } : r,
          ),
        })),

      cancelRide: (id) =>
        set((s) => ({ rides: s.rides.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)) })),

      rateRide: (id, stars, comment) => {
        const ride = get().rides.find((r) => r.id === id);
        if (!ride) return;
        const s = Math.max(1, Math.min(5, Math.round(stars)));
        set((st) => ({
          rides: st.rides.map((r) => (r.id === id ? { ...r, driverRating: s, ratingComment: comment } : r)),
        }));
        const driver = get().drivers.find((d) => d.id === ride.driverId);
        if (driver) {
          const newCount = driver.ratingsCount + 1;
          const newAvg = (driver.rating * driver.ratingsCount + s) / newCount;
          get().updateDriver(driver.id, { rating: Math.round(newAvg * 10) / 10, ratingsCount: newCount });
        }
      },

      markRidePaid: (id) =>
        set((s) => ({
          rides: s.rides.map((r) =>
            r.id === id ? { ...r, paid: true, status: r.status === "pending" ? "completed" : r.status } : r,
          ),
        })),

      generateUnlockCode: (driverId) => {
        const driver = get().drivers.find((d) => d.id === driverId);
        if (!driver) return null;
        const code = secureCode6();
        const now = new Date();
        const expires = new Date(now.getTime() + 24 * 3600 * 1000);
        const c: UnlockCode = {
          id: uid(), driverId, code,
          createdAt: now.toISOString(), expiresAt: expires.toISOString(), used: false,
        };
        set((s) => ({ codes: [c, ...s.codes] }));
        return c;
      },

      redeemCode: (driverId, code) => {
        const c = get().codes.find((x) => x.driverId === driverId && x.code === code && !x.used);
        if (!c) return { ok: false, msg: "Code invalide" };
        if (new Date(c.expiresAt) < new Date()) return { ok: false, msg: "Code expiré" };
        set((s) => ({ codes: s.codes.map((x) => (x.id === c.id ? { ...x, used: true } : x)) }));
        get().updateDriver(driverId, { blocked: false, subscriptionPaid: true, thresholdReachedAt: null });
        return { ok: true, msg: "Chauffeur débloqué" };
      },

      applyPromo: (code, amount) => {
        const p = get().promos.find((x) => x.active && x.code.toUpperCase() === code.trim().toUpperCase());
        if (!p) return { ok: false, discount: 0, msg: "Code promo invalide" };
        const discount = Math.round((amount * p.percentOff) / 100);
        return { ok: true, discount, msg: `-${p.percentOff}% appliqué` };
      },

      resetMonthlyCounters: () =>
        set((s) => ({
          drivers: s.drivers.map((d) => ({
            ...d, clientsThisMonth: 0, subscriptionPaid: false, thresholdReachedAt: null,
          })),
        })),

      checkAndBlockDrivers: () => {
        const { graceHours, threshold1 } = get().settings;
        const now = Date.now();
        set((s) => ({
          drivers: s.drivers.map((d) => {
            if (!d.blocked && !d.subscriptionPaid && d.thresholdReachedAt && d.clientsThisMonth >= threshold1) {
              const elapsed = (now - new Date(d.thresholdReachedAt).getTime()) / 3600000;
              if (elapsed >= graceHours) return { ...d, blocked: true };
            }
            return d;
          }),
        }));
      },

      updateSettings: (s) => set((st) => ({ settings: { ...st.settings, ...s } })),

      seedDemo: () => {
        const mk = (name: string, phone: string, zone: string, vehicle: string, plate: string, vc: VehicleClass, rating: number, ratings: number, clients = 0): Driver => ({
          id: uid(), name, phone, zone, vehicle, plate, vehicleClass: vc,
          accessPin: securePin4(),
          rating, ratingsCount: ratings,
          clientsThisMonth: clients, subscriptionPaid: clients >= 20,
          blocked: false, thresholdReachedAt: clients >= 10 ? new Date().toISOString() : null,
          createdAt: new Date().toISOString(),
        });
        const drivers: Driver[] = [
          mk("Jean Mballa", "699111111", "Bastos", "Toyota Corolla", "CE 234 AB", "eco", 4.8, 124, 5),
          mk("Paul Nkomo", "699222222", "Mvog-Mbi", "Hyundai Accent", "CE 552 CD", "eco", 4.6, 87, 12),
          mk("Marc Owona", "699333333", "Mendong", "Toyota Avensis", "CE 119 EF", "confort", 4.9, 210, 22),
          mk("Sylvie Eyenga", "699444444", "Nlongkak", "Kia Picanto", "CE 778 GH", "eco", 4.7, 56, 8),
          mk("Patrick Atangana", "699555555", "Nkolbisson", "Yamaha XTZ 125", "MT 901 AB", "moto", 4.5, 142, 7),
          mk("Aimé Tchamba", "699666666", "Essos", "Toyota Yaris", "CE 234 IJ", "eco", 4.4, 38, 3),
          mk("Léon Biya", "699777777", "Oyomabang", "Suzuki Swift", "CE 665 KL", "eco", 4.7, 91, 14),
          mk("Frédéric Mbarga", "699888888", "Tsinga", "Toyota Camry", "CE 122 MN", "confort", 4.9, 175, 11),
          mk("Joseph Onana", "699999000", "Ekounou", "TVS Apache 160", "MT 433 OP", "moto", 4.6, 88, 6),
          mk("Robert Ngono", "699000111", "Mokolo", "Nissan Micra", "CE 311 QR", "eco", 4.3, 29, 2),
        ];
        const clients: Client[] = [
          { id: uid(), name: "Marie Atangana", phone: "677111111", quartier: "Bastos", createdAt: new Date().toISOString() },
          { id: uid(), name: "Sophie Biya", phone: "677222222", quartier: "Mvan", createdAt: new Date().toISOString() },
          { id: uid(), name: "Pierre Eboa", phone: "677333333", quartier: "Essos", createdAt: new Date().toISOString() },
          { id: uid(), name: "Albert Kemajou", phone: "677444444", quartier: "Nkolbisson", createdAt: new Date().toISOString() },
        ];
        set({ drivers, clients, rides: [], codes: [] });
        get().checkAndBlockDrivers();
      },
    }),
    {
      name: "taxi-proxi-store",
      version: 2,
      migrate: (persisted: any) => {
        // soft-migrate v1 stores: ensure new fields exist with defaults
        if (!persisted) return persisted;
        persisted.promos ||= defaultPromos;
        persisted.trustedContact ??= "";
        persisted.settings = { ...defaultSettings, ...(persisted.settings || {}) };
        persisted.drivers = (persisted.drivers || []).map((d: any) => ({
          vehicleClass: "eco", rating: 0, ratingsCount: 0, ...d,
        }));
        persisted.rides = (persisted.rides || []).map((r: any) => ({
          vehicleClass: "eco", classMultiplier: 1,
          status: r.paid ? "completed" : "pending",
          startPin: r.startPin || "0000",
          shareToken: r.shareToken || uid(),
          ...r,
        }));
        return persisted;
      },
    },
  ),
);

export function computeFare(
  distanceKm: number,
  durationMin: number,
  waitMin: number,
  hour: number,
  settings: Settings,
  vehicleClass: VehicleClass = "eco",
) {
  const baseFare = distanceKm * settings.pricePerKm;
  const timeSurcharge = durationMin * settings.pricePerMin;
  const waitSurcharge = Math.floor(waitMin / 5) * settings.waitSurchargePer5min;
  const subtotal = baseFare + timeSurcharge + waitSurcharge;
  let peakMultiplier = 1;
  if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19))
    peakMultiplier = 1 + settings.peakHourPct;
  if (hour >= 22 || hour < 6) peakMultiplier = 1 + settings.nightPct;
  const classMultiplier = settings.classMultipliers[vehicleClass] ?? 1;
  let total = Math.round(subtotal * peakMultiplier * classMultiplier);
  total = Math.max(settings.minFare, Math.min(settings.maxFare, total));
  return {
    baseFare: Math.round(baseFare),
    timeSurcharge: Math.round(timeSurcharge),
    waitSurcharge,
    peakMultiplier,
    classMultiplier,
    total,
  };
}
