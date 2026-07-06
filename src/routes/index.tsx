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
