import { defineTool } from "@lovable.dev/mcp-js";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_driver_status",
  title: "Mon statut chauffeur",
  description:
    "Récupère le dossier chauffeur de l'utilisateur connecté : statut de vérification, abonnement, courses gratuites restantes et documents fournis.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const { data: driver, error } = await supabase
      .from("drivers")
      .select("verification_status, subscription_status, free_rides_remaining, created_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!driver) {
      return {
        content: [{ type: "text", text: "Cet utilisateur n'a pas de dossier chauffeur." }],
        structuredContent: { driver: null },
      };
    }

    const { data: documents } = await supabase
      .from("driver_documents")
      .select("doc_type, status, created_at")
      .eq("driver_id", userId);

    const payload = { driver, documents: documents ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});
