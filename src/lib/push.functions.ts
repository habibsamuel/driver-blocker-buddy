import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/firebase_messaging";

const TokenInput = z.object({
  token: z.string().min(20).max(500),
  platform: z.enum(["android", "ios", "web"]),
});

/** Enregistre (ou rafraîchit) le jeton de l'appareil du chauffeur connecté. */
export const registerDeviceToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => TokenInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("device_tokens").upsert(
      {
        user_id: context.userId,
        token: data.token,
        platform: data.platform,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "token" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const NotifyInput = z.object({ requestId: z.string().uuid() });

type FcmResult = { sent: number; configured: boolean };

/**
 * Fait sonner l'appareil des chauffeurs sollicités pour une demande de course,
 * même application fermée. Sans connexion Firebase reliée, retourne
 * `configured: false` : le temps réel dans l'app reste le canal de secours.
 */
export const notifyNearbyDrivers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => NotifyInput.parse(d))
  .handler(async ({ data, context }): Promise<FcmResult> => {
    // Le demandeur doit être le client de la course
    const { data: request, error: reqError } = await context.supabase
      .from("ride_requests")
      .select("id, client_id, destination, fare, distance_km")
      .eq("id", data.requestId)
      .maybeSingle();
    if (reqError) throw new Error(reqError.message);
    if (!request || request.client_id !== context.userId) throw new Error("Forbidden");

    const lovableKey = process.env["LOVABLE_API_KEY"];
    const connectionKey = process.env["FIREBASE_MESSAGING_API_KEY"];
    if (!lovableKey || !connectionKey) return { sent: 0, configured: false };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: offers } = await supabaseAdmin
      .from("ride_request_offers")
      .select("driver_id")
      .eq("request_id", request.id)
      .eq("status", "ringing");
    const driverIds = [...new Set((offers ?? []).map((o) => o.driver_id))];
    if (driverIds.length === 0) return { sent: 0, configured: true };

    const { data: devices } = await supabaseAdmin
      .from("device_tokens")
      .select("token")
      .in("user_id", driverIds);
    const tokens = (devices ?? []).map((d) => d.token);
    if (tokens.length === 0) return { sent: 0, configured: true };

    const headers = {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connectionKey,
      "Content-Type": "application/json",
    };

    let sent = 0;
    const stale: string[] = [];

    await Promise.all(
      tokens.map(async (token) => {
        const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: {
              token,
              notification: {
                title: "Nouvelle course 🚖",
                body: `${request.fare} XAF · ${request.destination} · ${Number(request.distance_km)} km`,
              },
              data: {
                requestId: request.id,
                fare: String(request.fare),
                destination: String(request.destination),
                path: "/chauffeurs",
              },
              android: {
                priority: "high",
                notification: { channel_id: "rides", sound: "default" },
              },
            },
          }),
        });
        if (res.ok) {
          sent += 1;
          return;
        }
        const body = await res.text();
        console.error(`FCM send failed [${res.status}]: ${body}`);
        if (res.status === 404 || res.status === 400) stale.push(token);
      }),
    );

    if (stale.length > 0) {
      await supabaseAdmin.from("device_tokens").delete().in("token", stale);
    }

    return { sent, configured: true };
  });
