import { createFileRoute } from "@tanstack/react-router";
import { Historique } from "@/features/Historique";
export const Route = createFileRoute("/historique")({ component: Historique });
