import { defineTool } from "@lovable.dev/mcp-js";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_online_drivers",
  title: "Chauffeurs en ligne",
  description: "Liste les chauffeurs Taxi Proxi actuellement en ligne avec leur dernière position connue.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("driver_positions")
      .select("driver_id, lat, lng, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const items = data ?? [];
    return {
      content: [{ type: "text", text: JSON.stringify({ count: items.length, items }) }],
      structuredContent: { count: items.length, items },
    };
  },
});
