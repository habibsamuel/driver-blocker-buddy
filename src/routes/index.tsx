import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Landing } from "@/features/Landing";
import { Dashboard } from "@/features/Dashboard";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  component: Home,
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
  return <Dashboard />;
}
