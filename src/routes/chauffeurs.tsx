import { createFileRoute } from "@tanstack/react-router";
import { Chauffeurs } from "@/features/Chauffeurs";
import { ChauffeurGate } from "@/features/ChauffeurGate";

export const Route = createFileRoute("/chauffeurs")({
  component: () => (
    <ChauffeurGate>
      <Chauffeurs />
    </ChauffeurGate>
  ),
});
