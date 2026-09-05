import { createFileRoute } from "@tanstack/react-router";
import { Conditions } from "@/features/Conditions";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/conditions")({
  component: Conditions,
  head: () =>
    pageHead({
      path: "/conditions",
      title: "Conditions générales d'utilisation — Taxi Proxi",
      description:
        "Règles d'utilisation de Taxi Proxi : rôle de la plateforme, paiement en espèces, obligations, responsabilité et droit applicable.",
    }),
});
