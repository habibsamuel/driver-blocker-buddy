import { createFileRoute } from "@tanstack/react-router";
import { Confidentialite } from "@/features/Confidentialite";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/confidentialite")({
  component: Confidentialite,
  head: () =>
    pageHead({
      path: "/confidentialite",
      title: "Politique de confidentialité — Taxi Proxi",
      description:
        "Comment Taxi Proxi collecte, utilise et protège vos données : localisation, courses, documents chauffeurs et vos droits.",
    }),
});
