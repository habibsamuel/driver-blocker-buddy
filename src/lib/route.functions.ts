import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  from: z.string().min(2).max(200).optional(),
  originLat: z.number().optional(),
  originLng: z.number().optional(),
  to: z.string().min(2).max(200),
  region: z.string().min(2).max(80).optional(),
});

export const estimateRoute = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    const connKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey || !connKey) throw new Error("Google Maps connector not configured");

    const region = data.region ?? "Yaoundé, Cameroun";

    const origin =
      typeof data.originLat === "number" && typeof data.originLng === "number"
        ? { location: { latLng: { latitude: data.originLat, longitude: data.originLng } } }
        : { address: `${data.from ?? ""}, ${region}` };

    const res = await fetch(
      "https://connector-gateway.lovable.dev/google_maps/routes/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Connection-Api-Key": connKey,
          "Content-Type": "application/json",
          "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
        },
        body: JSON.stringify({
          origin,
          destination: { address: `${data.to}, ${region}` },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_AWARE",
        }),
      },
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Routes API ${res.status}: ${body.slice(0, 200)}`);
    }
    const json = (await res.json()) as {
      routes?: { distanceMeters?: number; duration?: string }[];
    };
    const route = json.routes?.[0];
    if (!route?.distanceMeters) throw new Error("Itinéraire introuvable");
    const distanceKm = +(route.distanceMeters / 1000).toFixed(2);
    const durationMin = route.duration
      ? Math.max(1, Math.round(parseInt(route.duration.replace("s", ""), 10) / 60))
      : Math.max(1, Math.round(distanceKm * 2.5));
    return { distanceKm, durationMin };
  });
