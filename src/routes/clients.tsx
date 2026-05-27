import { createFileRoute } from "@tanstack/react-router";
import { Clients } from "@/features/Clients";
export const Route = createFileRoute("/clients")({ component: Clients });
