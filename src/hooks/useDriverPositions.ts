import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type LiveDriver = {
  driver_id: string;
  lat: number;
  lng: number;
  heading: number | null;
  is_online: boolean;
  updated_at: string;
  name?: string;
};

export function useDriverPositions() {
  const [drivers, setDrivers] = useState<LiveDriver[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      const { data, error } = await supabase
        .from("driver_positions")
        .select("driver_id,lat,lng,heading,is_online,updated_at")
        .eq("is_online", true);
      if (error || cancelled || !data) return;
      // join names
      const ids = data.map((d) => d.driver_id);
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("user_id,name").in("user_id", ids)
        : { data: [] as { user_id: string; name: string }[] };
      const nameMap = new Map((profs ?? []).map((p) => [p.user_id, p.name]));
      if (!cancelled) {
        setDrivers(
          data.map((d) => ({ ...d, name: nameMap.get(d.driver_id) ?? "Chauffeur" })),
        );
      }
    };

    fetchAll();

    const channel = supabase
      .channel("driver_positions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "driver_positions" },
        () => fetchAll(),
      )
      .subscribe();

    const interval = setInterval(fetchAll, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return drivers;
}
