import { createFileRoute } from "@tanstack/react-router";
import { Chauffeurs } from "@/features/Chauffeurs";
export const Route = createFileRoute("/chauffeurs")({ component: Chauffeurs });
