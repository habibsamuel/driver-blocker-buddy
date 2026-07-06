import { createFileRoute } from "@tanstack/react-router";
import { Course } from "@/features/Course";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/course")({
  component: Course,
  head: () =>
    pageHead({
      path: "/course",
      title: "Réserver une course — Taxi Proxi Yaoundé",
      description:
        "Commandez un taxi à Yaoundé en quelques secondes : Bend-Skin, Éco ou Confort. Géolocalisation temps réel et paiement cash.",
    }),
});
