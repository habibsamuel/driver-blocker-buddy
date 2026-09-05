import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Suppression définitive du compte de l'utilisateur connecté.
 * Exigée par les règles du Play Store : l'utilisateur doit pouvoir
 * supprimer son compte et ses données depuis l'application.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Données liées supprimées d'abord (les tables sans cascade)
    await supabaseAdmin.from("device_tokens").delete().eq("user_id", userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
