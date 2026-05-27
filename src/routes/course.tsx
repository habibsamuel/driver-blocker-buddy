import { createFileRoute } from "@tanstack/react-router";
import { Course } from "@/features/Course";
export const Route = createFileRoute("/course")({ component: Course });
