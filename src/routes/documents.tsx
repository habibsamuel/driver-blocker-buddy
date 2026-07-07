import { createFileRoute } from "@tanstack/react-router";
import { DriverDocuments } from "@/features/DriverDocuments";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/documents")({
  component: DriverDocuments,
  head: () => ({
    ...pageHead({
      path: "/documents",
      title: "Mes documents — Taxi Proxi",
      description: "Envoyez et suivez la vérification de vos documents chauffeur.",
    }),
    meta: [
      { title: "Mes documents — Taxi Proxi" },
      { name: "description", content: "Vérification de vos documents chauffeur Taxi Proxi." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});
