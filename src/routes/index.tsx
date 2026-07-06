import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Suspense, lazy, useEffect } from "react";
import { Landing } from "@/features/Landing";
import { useAuth } from "@/hooks/useAuth";

// Lazy: Dashboard (and its heavy deps like MapView/charts) is only needed
// for signed-in users. Anonymous landing visitors should not download it.
const Dashboard = lazy(() =>
  import("@/features/Dashboard").then((m) => ({ default: m.Dashboard })),
);

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Taxi Proxi — Réservez votre taxi à Yaoundé" },
      {
        name: "description",
        content:
          "Taxi Proxi : réservez un taxi à Yaoundé (Bend-Skin, Éco, Confort) en quelques secondes. Géolocalisation temps réel, code PIN sécurisé, paiement cash.",
      },
      { property: "og:title", content: "Taxi Proxi — Réservez votre taxi à Yaoundé" },
      {
        property: "og:description",
        content:
          "Réservez un taxi à Yaoundé en quelques secondes. Géolocalisation temps réel et code PIN.",
      },
      { property: "og:url", content: "https://taxiproxicamer.lovable.app/" },
      { property: "og:type", content: "website" },
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

function Home() {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    // Role-based redirect after login
    if (roles.includes("admin")) return; // admin stays on dashboard-style home
    if (roles.includes("chauffeur")) {
      navigate({ to: "/chauffeurs" });
      return;
    }
    // client → réservation
    navigate({ to: "/course" });
  }, [user, roles, loading, navigate]);

  if (!user) return <Landing />;
  // Authenticated fallback (admin sees dashboard, others briefly before redirect)
  return (
    <Suspense fallback={null}>
      <Dashboard />
    </Suspense>
  );
}
