import { createFileRoute } from "@tanstack/react-router";
import { TaxiHome } from "@/features/TaxiHome";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/course")({
  component: TaxiHome,
  head: () =>
    pageHead({
      path: "/course",
      title: "Réserver une course — Taxi Proxi Yaoundé",
      description:
        "Commandez un taxi à Yaoundé en quelques secondes : Bend-Skin, Éco ou Confort. Géolocalisation temps réel et paiement cash.",
    }),
});
