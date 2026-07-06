import { createFileRoute } from "@tanstack/react-router";
import { Securite } from "@/features/Securite";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/securite")({
  component: Securite,
  head: () =>
    pageHead({
      path: "/securite",
      title: "Sécurité & code PIN — Taxi Proxi",
      description:
        "Voyagez en toute sérénité : code PIN par course, partage de trajet et signalement d'urgence sur Taxi Proxi.",
    }),
});
