import { createFileRoute } from "@tanstack/react-router";
import { Admin } from "@/features/Admin";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/admin")({
  component: Admin,
  head: () => ({
    ...pageHead({
      path: "/admin",
      title: "Administration — Taxi Proxi",
      description: "Console d'administration Taxi Proxi.",
    }),
    meta: [
      { title: "Administration — Taxi Proxi" },
      { name: "description", content: "Console d'administration Taxi Proxi." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});
