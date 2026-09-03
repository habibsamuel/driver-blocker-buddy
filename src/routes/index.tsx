import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Landing } from "@/features/Landing";
import { useAuth } from "@/hooks/useAuth";


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
  const { user, roles, loading, rolesLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || rolesLoading || !user) return;
    // Redirection de bienvenue : une seule fois par session, après connexion.
    // L'accueil reste ensuite librement accessible (y compris aux nouveaux inscrits).
    let already = false;
    try {
      already = sessionStorage.getItem(`taxi-proxi-landed-${user.id}`) === "1";
      sessionStorage.setItem(`taxi-proxi-landed-${user.id}`, "1");
    } catch {
      already = true;
    }
    if (already) return;
    if (roles.includes("admin")) return;
    if (roles.includes("chauffeur")) navigate({ to: "/chauffeurs" });
    else navigate({ to: "/course" });
  }, [user, roles, loading, rolesLoading, navigate]);


  if (!user) return <Landing />;
  // Authenticated fallback (admin sees dashboard, others briefly before redirect)
  return (
    <Suspense fallback={null}>
      <Dashboard />
    </Suspense>
  );
}
