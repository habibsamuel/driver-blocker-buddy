import { createFileRoute } from "@tanstack/react-router";
import { Clients } from "@/features/Clients";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/clients")({
  component: Clients,
  head: () =>
    pageHead({
      path: "/clients",
      title: "Espace clients — Taxi Proxi",
      description:
        "Retrouvez vos courses, notes et préférences de trajet sur Taxi Proxi, votre app taxi à Yaoundé.",
    }),
});
