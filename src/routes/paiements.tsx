import { createFileRoute } from "@tanstack/react-router";
import { Paiements } from "@/features/Paiements";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/paiements")({
  component: Paiements,
  head: () =>
    pageHead({
      path: "/paiements",
      title: "Paiements & reçus — Taxi Proxi",
      description:
        "Gérez vos paiements cash, mobile money et reçus de courses Taxi Proxi à Yaoundé.",
    }),
});
