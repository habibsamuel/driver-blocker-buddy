import { createFileRoute } from "@tanstack/react-router";
import { TaxiHome } from "@/features/TaxiHome";

export const Route = createFileRoute("/")({
  component: TaxiHome,
  head: () => ({
    meta: [
      { title: "Taxi Proxi — Réservez votre taxi à Yaoundé" },
      {
        name: "description",
        content:
          "Taxi Proxi : réservez un taxi Eco ou Confort à Yaoundé en quelques secondes. Géolocalisation temps réel et paiement cash.",
      },
      { property: "og:title", content: "Taxi Proxi — Réservez votre taxi à Yaoundé" },
      {
        property: "og:description",
        content:
          "Réservez un taxi à Yaoundé en quelques secondes. Géolocalisation temps réel et code PIN.",
      },
      { property: "og:url", content: "https://taxiproxicamer.lovable.app/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://taxiproxicamer.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Taxi Proxi",
          serviceType: "Réservation de taxi et covoiturage",
          areaServed: { "@type": "City", name: "Yaoundé" },
          provider: { "@type": "Organization", name: "Taxi Proxi" },
          url: "https://taxiproxicamer.lovable.app/",
        }),
      },
    ],
  }),
});
