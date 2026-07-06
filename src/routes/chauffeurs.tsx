import { createFileRoute } from "@tanstack/react-router";
import { Chauffeurs } from "@/features/Chauffeurs";
import { ChauffeurGate } from "@/features/ChauffeurGate";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/chauffeurs")({
  component: () => (
    <ChauffeurGate>
      <Chauffeurs />
    </ChauffeurGate>
  ),
  head: () =>
    pageHead({
      path: "/chauffeurs",
      title: "Espace chauffeur — Taxi Proxi",
      description:
        "Tableau de bord chauffeur Taxi Proxi : courses en direct, revenus et statistiques à Yaoundé.",
    }),
});
