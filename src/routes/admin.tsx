import { createFileRoute } from "@tanstack/react-router";
import { Admin } from "@/features/Admin";
export const Route = createFileRoute("/admin")({ component: Admin });
