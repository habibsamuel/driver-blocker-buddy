import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";

const TurnByTurnNav = lazy(() => import("@/components/TurnByTurnNav").then((m) => ({ default: m.TurnByTurnNav })));

export const Route = createFileRoute("/navigation")({
  head: () => ({
    meta: [
      { title: "Navigation chauffeur | TAXI PROXI Yaoundé" },
      { name: "description", content: "Guidage GPS tour par tour en français avec instructions vocales pour les chauffeurs TAXI PROXI à Yaoundé." },
      { property: "og:title", content: "Navigation chauffeur | TAXI PROXI" },
      { property: "og:description", content: "Guidage vocal tour par tour en français pour les chauffeurs à Yaoundé." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<div className="h-[100dvh] bg-background" />}>
      <Suspense fallback={<div className="h-[100dvh] bg-background" />}>
        <TurnByTurnNav />
      </Suspense>
    </ClientOnly>
  ),
});
