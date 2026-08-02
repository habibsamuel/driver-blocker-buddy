import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfile from "./tools/get-my-profile";
import listMyReferrals from "./tools/list-my-referrals";
import getMyDriverStatus from "./tools/get-my-driver-status";
import estimateFare from "./tools/estimate-fare";
import listOnlineDrivers from "./tools/list-online-drivers";

// L'issuer OAuth doit pointer vers l'hôte Supabase direct (voir knowledge MCP).
const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "driver-block-manager",
  title: "Driver Block Manager",
  version: "0.1.0",
  instructions:
    "Outils Taxi Proxi (Yaoundé). Utilisez get_my_profile pour le compte et le code de parrainage, list_my_referrals pour les parrainages, get_my_driver_status pour le dossier chauffeur (vérification, abonnement, courses gratuites), estimate_fare pour estimer un tarif en XAF, et list_online_drivers pour voir les chauffeurs en ligne.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getMyProfile, listMyReferrals, getMyDriverStatus, estimateFare, listOnlineDrivers],
});
