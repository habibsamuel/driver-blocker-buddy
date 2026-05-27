import { createFileRoute } from "@tanstack/react-router";
import { Paiements } from "@/features/Paiements";
export const Route = createFileRoute("/paiements")({ component: Paiements });
