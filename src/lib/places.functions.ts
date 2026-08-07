import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  query: z.string().min(2).max(120),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  /** Rayon de biais géographique en mètres (zone proche de l'utilisateur). */
  radius: z.number().min(500).max(50000).optional(),
});

export type PlaceSuggestion = {
  id: string;
  /** Nom principal : repère, quartier ou rue. */
  label: string;
  /** Contexte : quartier / ville. */
  secondary: string;
};

/**
 * Suggestions de lieux (repères, quartiers, rues) biaisées autour de la
 * position GPS de l'utilisateur pour maximiser la précision.
 */
export const suggestPlaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }): Promise<{ suggestions: PlaceSuggestion[] }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    const connKey = process.env["GOOGLE_MAPS_API_KEY"];
    if (!apiKey || !connKey) return { suggestions: [] };

    const body: Record<string, unknown> = {
      input: data.query,
      includedRegionCodes: ["cm"],
      languageCode: "fr",
    };
    if (typeof data.lat === "number" && typeof data.lng === "number") {
      body["locationBias"] = {
        circle: {
          center: { latitude: data.lat, longitude: data.lng },
          radius: data.radius ?? 15000,
        },
      };
    }

    const res = await fetch(
      "https://connector-gateway.lovable.dev/google_maps/places/v1/places:autocomplete",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Connection-Api-Key": connKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      console.error(`Places autocomplete failed [${res.status}]: ${text}`);
      return { suggestions: [] };
    }
    const json = (await res.json()) as {
      suggestions?: {
        placePrediction?: {
          placeId?: string;
          structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
          text?: { text?: string };
        };
      }[];
    };
    const suggestions: PlaceSuggestion[] = (json.suggestions ?? [])
      .map((s, i) => {
        const p = s.placePrediction;
        if (!p) return null;
        const label = p.structuredFormat?.mainText?.text ?? p.text?.text ?? "";
        if (!label) return null;
        return {
          id: p.placeId ?? `sugg-${i}`,
          label,
          secondary: p.structuredFormat?.secondaryText?.text ?? "",
        };
      })
      .filter((s): s is PlaceSuggestion => s !== null)
      .slice(0, 6);

    return { suggestions };
  });
