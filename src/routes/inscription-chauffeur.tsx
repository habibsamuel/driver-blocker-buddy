import { createFileRoute } from "@tanstack/react-router";
import { InscriptionChauffeur } from "@/features/InscriptionChauffeur";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/inscription-chauffeur")({
  component: InscriptionChauffeur,
  head: () =>
    pageHead({
      path: "/inscription-chauffeur",
      title: "Devenir chauffeur — Taxi Proxi Yaoundé",
      description:
        "Inscrivez-vous comme chauffeur Taxi Proxi à Yaoundé : Bend-Skin, Éco ou Confort. Revenus quotidiens et flexibilité.",
    }),
});
