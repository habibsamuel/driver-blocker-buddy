import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

const CATEGORIES = ["bend_skin", "eco", "confort"] as const;

export default defineTool({
  name: "estimate_fare",
  title: "Estimer un tarif",
  description:
    "Calcule le tarif Taxi Proxi (XAF) à partir d'une distance en km et d'une durée en minutes, selon la catégorie de véhicule et les tarifs officiels.",
  inputSchema: {
    distance_km: z.number().positive().describe("Distance du trajet en kilomètres."),
    duration_min: z.number().nonnegative().describe("Durée estimée du trajet en minutes."),
    vehicle_category: z
      .enum(CATEGORIES)
      .describe("Catégorie de véhicule : bend_skin (moto), eco ou confort."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ distance_km, duration_min, vehicle_category }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("pricing_rules")
      .select("vehicle_category, price_per_km, price_per_min, minimum_fare")
      .eq("vehicle_category", vehicle_category)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) {
      return { content: [{ type: "text", text: "Tarifs indisponibles pour cette catégorie." }], isError: true };
    }
    const gross = distance_km * Number(data.price_per_km) + duration_min * Number(data.price_per_min);
    const fare = Math.ceil(Math.max(gross, Number(data.minimum_fare)) / 50) * 50;
    const payload = { vehicle_category, distance_km, duration_min, fare_xaf: fare };
    return {
      content: [{ type: "text", text: `Tarif estimé : ${fare} XAF (${vehicle_category})` }],
      structuredContent: payload,
    };
  },
});
