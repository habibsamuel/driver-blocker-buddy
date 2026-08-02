import { defineTool } from "@lovable.dev/mcp-js";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_referrals",
  title: "Mes parrainages",
  description: "Liste les personnes parrainées par l'utilisateur connecté et les récompenses gagnées.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("referrals")
      .select("code_used, reward_amount, created_at")
      .eq("referrer_id", ctx.getUserId())
      .order("created_at", { ascending: false });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const items = data ?? [];
    const total = items.reduce((sum, r) => sum + Number(r.reward_amount ?? 0), 0);
    return {
      content: [{ type: "text", text: JSON.stringify({ count: items.length, total_xaf: total, items }) }],
      structuredContent: { count: items.length, total_xaf: total, items },
    };
  },
});
