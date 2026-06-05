import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Driver = {
  id: string;
  name: string;
  phone: string;
  zone: string;
  clientsThisMonth: number;
  subscriptionPaid: boolean;
  blocked: boolean;
  thresholdReachedAt: string | null; // ISO date when 10/20 clients reached
  createdAt: string;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  quartier: string;
  createdAt: string;
};

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
  peakMultiplier: number; // 1, 1.1 or 1.2
  total: number;
  paid: boolean;
  createdAt: string;
};

export type UnlockCode = {
  id: string;
  driverId: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
};

type Settings = {
  pricePerKm: number;
  pricePerMin: number;
  minFare: number;
  maxFare: number;
  waitSurchargePer5min: number;
  peakHourPct: number; // 0.10
  nightPct: number; // 0.20
  threshold1: number; // 10
  threshold2: number; // 20
  subscription1: number; // 500
  subscription2: number; // 1000
  graceHours: number; // 48
  paymentNumber: string;
  adminPin: string; // 4-6 digit PIN to unlock admin role
};

export type Role = "client" | "chauffeur" | "admin";

type State = {
  drivers: Driver[];
  clients: Client[];
  rides: Ride[];
  codes: UnlockCode[];
  settings: Settings;
  role: Role;
  setRole: (r: Role) => void;
  addDriver: (d: Omit<Driver, "id" | "clientsThisMonth" | "subscriptionPaid" | "blocked" | "thresholdReachedAt" | "createdAt">) => void;
  updateDriver: (id: string, patch: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;
  addClient: (c: Omit<Client, "id" | "createdAt">) => void;
  deleteClient: (id: string) => void;
  addRide: (r: Omit<Ride, "id" | "createdAt" | "paid">) => Ride | null;
  markRidePaid: (id: string) => void;
  generateUnlockCode: (driverId: string) => UnlockCode | null;
  redeemCode: (driverId: string, code: string) => { ok: boolean; msg: string };
  resetMonthlyCounters: () => void;
  checkAndBlockDrivers: () => void;
  updateSettings: (s: Partial<Settings>) => void;
  seedDemo: () => void;
};

const _crypto: Crypto = (globalThis as { crypto: Crypto }).crypto;

const uid = () => {
  if ("randomUUID" in _crypto) return _crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  const arr = new Uint8Array(8);
  _crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 10);
};

const secureCode6 = () => {
  const arr = new Uint32Array(1);
  _crypto.getRandomValues(arr);
  return ((arr[0] % 900000) + 100000).toString();
};
};

const defaultSettings: Settings = {
  pricePerKm: 100,
  pricePerMin: 5,
  minFare: 750,     // ✅ Changed from 250 to 750
  maxFare: 3000,    // ✅ Changed from 1500 to 3000
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
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      drivers: [],
      clients: [],
      rides: [],
      codes: [],
      settings: defaultSettings,
      role: "client",
      setRole: (r) => set({ role: r }),

      addDriver: (d) =>
        set((s) => ({
          drivers: [
            ...s.drivers,
            {
              ...d,
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
        set((s) => ({
          drivers: s.drivers.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),

      deleteDriver: (id) =>
        set((s) => ({ drivers: s.drivers.filter((d) => d.id !== id) })),

      addClient: (c) =>
        set((s) => ({
          clients: [
            ...s.clients,
            { ...c, id: uid(), createdAt: new Date().toISOString() },
          ],
        })),

      deleteClient: (id) =>
        set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),

      addRide: (r) => {
        const driver = get().drivers.find((d) => d.id === r.driverId);
        if (!driver) return null;
        if (driver.blocked) return null;
        const ride: Ride = {
          ...r,
          id: uid(),
          paid: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ rides: [ride, ...s.rides] }));
        // increment counter
        const newCount = driver.clientsThisMonth + 1;
        const { threshold1, threshold2 } = get().settings;
        let thresholdReachedAt = driver.thresholdReachedAt;
        if (!thresholdReachedAt && newCount >= threshold1) {
          thresholdReachedAt = new Date().toISOString();
        }
        get().updateDriver(driver.id, {
          clientsThisMonth: newCount,
          thresholdReachedAt,
        });
        get().checkAndBlockDrivers();
        return ride;
      },

      markRidePaid: (id) =>
        set((s) => ({
          rides: s.rides.map((r) => (r.id === id ? { ...r, paid: true } : r)),
        })),

      generateUnlockCode: (driverId) => {
        const driver = get().drivers.find((d) => d.id === driverId);
        if (!driver) return null;
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const now = new Date();
        const expires = new Date(now.getTime() + 24 * 3600 * 1000);
        const c: UnlockCode = {
          id: uid(),
          driverId,
          code,
          createdAt: now.toISOString(),
          expiresAt: expires.toISOString(),
          used: false,
        };
        set((s) => ({ codes: [c, ...s.codes] }));
        return c;
      },

      redeemCode: (driverId, code) => {
        const c = get().codes.find(
          (x) => x.driverId === driverId && x.code === code && !x.used,
        );
        if (!c) return { ok: false, msg: "Code invalide" };
        if (new Date(c.expiresAt) < new Date())
          return { ok: false, msg: "Code expiré" };
        set((s) => ({
          codes: s.codes.map((x) => (x.id === c.id ? { ...x, used: true } : x)),
        }));
        get().updateDriver(driverId, {
          blocked: false,
          subscriptionPaid: true,
          thresholdReachedAt: null,
        });
        return { ok: true, msg: "Chauffeur débloqué" };
      },

      resetMonthlyCounters: () =>
        set((s) => ({
          drivers: s.drivers.map((d) => ({
            ...d,
            clientsThisMonth: 0,
            subscriptionPaid: false,
            thresholdReachedAt: null,
          })),
        })),

      checkAndBlockDrivers: () => {
        const { graceHours, threshold1 } = get().settings;
        const now = Date.now();
        set((s) => ({
          drivers: s.drivers.map((d) => {
            if (
              !d.blocked &&
              !d.subscriptionPaid &&
              d.thresholdReachedAt &&
              d.clientsThisMonth >= threshold1
            ) {
              const elapsed =
                (now - new Date(d.thresholdReachedAt).getTime()) / 3600000;
              if (elapsed >= graceHours) {
                return { ...d, blocked: true };
              }
            }
            return d;
          }),
        }));
      },

      updateSettings: (s) =>
        set((st) => ({ settings: { ...st.settings, ...s } })),

      seedDemo: () => {
        const drivers: Driver[] = [
          { id: uid(), name: "Jean Mballa", phone: "699111111", zone: "Bastos", clientsThisMonth: 5, subscriptionPaid: false, blocked: false, thresholdReachedAt: null, createdAt: new Date().toISOString() },
          { id: uid(), name: "Paul Nkomo", phone: "699222222", zone: "Mvog-Mbi", clientsThisMonth: 12, subscriptionPaid: false, blocked: false, thresholdReachedAt: new Date(Date.now() - 60*3600*1000).toISOString(), createdAt: new Date().toISOString() },
          { id: uid(), name: "Marc Owona", phone: "699333333", zone: "Mendong", clientsThisMonth: 22, subscriptionPaid: true, blocked: false, thresholdReachedAt: null, createdAt: new Date().toISOString() },
        ];
        const clients: Client[] = [
          { id: uid(), name: "Marie Atangana", phone: "677111111", quartier: "Bastos", createdAt: new Date().toISOString() },
          { id: uid(), name: "Sophie Biya", phone: "677222222", quartier: "Mvan", createdAt: new Date().toISOString() },
        ];
        set({ drivers, clients, rides: [], codes: [] });
        get().checkAndBlockDrivers();
      },
    }),
    { name: "taxi-proxi-store" },
  ),
);

export function computeFare(
  distanceKm: number,
  durationMin: number,
  waitMin: number,
  hour: number,
  settings: Settings,
) {
  const baseFare = distanceKm * settings.pricePerKm;
  const timeSurcharge = durationMin * settings.pricePerMin;
  const waitSurcharge =
    Math.floor(waitMin / 5) * settings.waitSurchargePer5min;
  let subtotal = baseFare + timeSurcharge + waitSurcharge;
  let peakMultiplier = 1;
  if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19))
    peakMultiplier = 1 + settings.peakHourPct;
  if (hour >= 22 || hour < 6) peakMultiplier = 1 + settings.nightPct;
  let total = Math.round(subtotal * peakMultiplier);
  // ✅ Ensure total is within bounds [minFare, maxFare]
  total = Math.max(settings.minFare, Math.min(settings.maxFare, total));
  return {
    baseFare: Math.round(baseFare),
    timeSurcharge: Math.round(timeSurcharge),
    waitSurcharge,
    peakMultiplier,
    total,
  };
}
