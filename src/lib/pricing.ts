import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { VehicleClass } from "@/lib/store";

export type PricingCategory = "bend_skin" | "eco" | "confort";

export type PricingRule = {
  vehicle_category: PricingCategory;
  price_per_km: number;
  price_per_min: number;
  minimum_fare: number;
};

export const vehicleClassToCategory = (vc: VehicleClass): PricingCategory =>
  vc === "moto" ? "bend_skin" : vc;

/** Arrondi au multiple de 50 XAF supérieur */
export const roundUp50 = (n: number) => Math.ceil(n / 50) * 50;

export function computeDynamicFare(
  distanceKm: number,
  durationMin: number,
  rule: PricingRule,
) {
  const gross = distanceKm * rule.price_per_km + durationMin * rule.price_per_min;
  const withMin = Math.max(gross, rule.minimum_fare);
  return roundUp50(withMin);
}

export function usePricingRules() {
  const [rules, setRules] = useState<Record<PricingCategory, PricingRule> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("pricing_rules")
      .select("vehicle_category, price_per_km, price_per_min, minimum_fare")
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) { setError(error.message); return; }
        const map = {} as Record<PricingCategory, PricingRule>;
        for (const r of data || []) {
          map[r.vehicle_category as PricingCategory] = {
            vehicle_category: r.vehicle_category as PricingCategory,
            price_per_km: Number(r.price_per_km),
            price_per_min: Number(r.price_per_min),
            minimum_fare: Number(r.minimum_fare),
          };
        }
        setRules(map);
      });
    return () => { mounted = false; };
  }, []);

  return { rules, error };
}
