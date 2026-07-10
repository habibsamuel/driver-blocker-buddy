import { createFileRoute } from "@tanstack/react-router";
import { DriverSubscription } from "@/features/DriverSubscription";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/abonnement-chauffeur")({
  component: DriverSubscription,
  head: () =>
    pageHead({
      path: "/abonnement-chauffeur",
      title: "Abonnement chauffeur — Taxi Proxi",
      description: "Souscrivez à un abonnement mensuel Taxi Proxi et payez par Orange Money.",
    }),
});
