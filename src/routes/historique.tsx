import { createFileRoute } from "@tanstack/react-router";
import { Historique } from "@/features/Historique";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/historique")({
  component: Historique,
  head: () =>
    pageHead({
      path: "/historique",
      title: "Historique des courses — Taxi Proxi",
      description:
        "Consultez l'historique de vos courses, reçus et paiements effectués avec Taxi Proxi à Yaoundé.",
    }),
});
