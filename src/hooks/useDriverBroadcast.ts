import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { GeoPosition } from "./useGeolocation";

export function useDriverBroadcast(opts: {
  enabled: boolean;
  userId: string | null;
  position: GeoPosition | null;
}) {
  const { enabled, userId, position } = opts;

  useEffect(() => {
    if (!enabled || !userId || !position) return;
    const send = async () => {
      await supabase.from("driver_positions").upsert({
        driver_id: userId,
        lat: position.lat,
        lng: position.lng,
        heading: position.heading,
        is_online: true,
        updated_at: new Date().toISOString(),
      });
    };
    send();
  }, [enabled, userId, position?.lat, position?.lng]);

  // mark offline on disable
  useEffect(() => {
    if (enabled || !userId) return;
    supabase.from("driver_positions").update({ is_online: false }).eq("driver_id", userId);
  }, [enabled, userId]);
}
