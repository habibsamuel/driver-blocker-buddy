import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RingingOffer = {
  requestId: string;
  distanceKm: number;
  clientName: string;
  clientPhone: string;
  destination: string;
  fare: number;
  tripDistanceKm: number;
  durationMin: number;
  expiresAt: string;
};

/**
 * Écoute les demandes de course qui « sonnent » chez le chauffeur connecté
 * (style appel WhatsApp) et permet d'accepter ou refuser.
 */
export function useDriverOffers(userId: string | null) {
  const [offer, setOffer] = useState<RingingOffer | null>(null);
  const [responding, setResponding] = useState(false);

  const loadRequest = useCallback(async (requestId: string, distanceKm: number) => {
    const { data } = await supabase
      .from("ride_requests")
      .select("id, client_name, client_phone, destination, fare, distance_km, duration_min, status, expires_at")
      .eq("id", requestId)
      .maybeSingle();
    if (!data || data.status !== "searching") return;
    if (new Date(data.expires_at).getTime() < Date.now()) return;
    setOffer({
      requestId: data.id,
      distanceKm,
      clientName: data.client_name || "Client",
      clientPhone: data.client_phone || "",
      destination: data.destination,
      fare: data.fare,
      tripDistanceKm: Number(data.distance_km),
      durationMin: data.duration_min,
      expiresAt: data.expires_at,
    });
  }, []);

  // Offres déjà en cours au montage
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("ride_request_offers")
        .select("request_id, distance_km, status")
        .eq("driver_id", userId)
        .eq("status", "ringing")
        .order("created_at", { ascending: false })
        .limit(1);
      const row = data?.[0];
      if (!cancelled && row) await loadRequest(row.request_id, Number(row.distance_km));
    })();
    return () => { cancelled = true; };
  }, [userId, loadRequest]);

  // Temps réel : nouvelles sonneries + fin de sonnerie
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`driver-offers-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ride_request_offers", filter: `driver_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as { request_id: string; distance_km: number; status: string };
          if (row.status === "ringing") void loadRequest(row.request_id, Number(row.distance_km));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ride_request_offers", filter: `driver_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as { request_id: string; status: string };
          if (row.status !== "ringing") {
            setOffer((cur) => (cur && cur.requestId === row.request_id ? null : cur));
          }
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, loadRequest]);

  // Expiration automatique (45 s)
  useEffect(() => {
    if (!offer) return;
    const ms = new Date(offer.expiresAt).getTime() - Date.now();
    const t = setTimeout(() => setOffer(null), Math.max(0, ms));
    return () => clearTimeout(t);
  }, [offer?.requestId, offer?.expiresAt]);

  const respond = useCallback(
    async (accept: boolean) => {
      if (!offer) return false;
      setResponding(true);
      try {
        const { data } = await supabase.rpc("respond_ride_request", {
          _request_id: offer.requestId,
          _accept: accept,
        });
        setOffer(null);
        return data === true;
      } finally {
        setResponding(false);
      }
    },
    [offer],
  );

  return { offer, respond, responding, dismiss: () => setOffer(null) };
}
