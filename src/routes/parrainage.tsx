import { createFileRoute } from "@tanstack/react-router";
import { Parrainage } from "@/features/Parrainage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/parrainage")({
  component: Parrainage,
  head: () =>
    pageHead({
      path: "/parrainage",
      title: "Parrainage — Invitez et gagnez 500 XAF | Taxi Proxi",
      description:
        "Partagez votre code Taxi Proxi et gagnez 500 XAF pour chaque ami qui effectue sa première course à Yaoundé.",
    }),
});
