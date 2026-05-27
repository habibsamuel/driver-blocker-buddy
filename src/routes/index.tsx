import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/features/Dashboard";

export const Route = createFileRoute("/")({
  component: () => (
    <Layout>
      <Dashboard />
    </Layout>
  ),
});

// Wrapper isn't actually used because Layout has Outlet. Render directly:
