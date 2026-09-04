import { useAuth } from "@/hooks/useAuth";
import { useDriverOffers } from "@/hooks/useDriverOffers";
import { useNativePush } from "@/hooks/useNativePush";
import { IncomingRideCall } from "@/components/IncomingRideCall";
import { toast } from "sonner";

/**
 * Monté dans l'espace chauffeur : affiche l'appel entrant plein écran
 * dès qu'une course sonne pour le chauffeur connecté.
 */
export function DriverCallListener() {
  const { user } = useAuth();
  const { offer, respond, responding } = useDriverOffers(user?.id ?? null);
  useNativePush(user?.id ?? null);

  if (!offer) return null;

  return (
    <IncomingRideCall
      offer={offer}
      busy={responding}
      onAccept={async () => {
        const won = await respond(true);
        if (won) toast.success("Course acceptée — rejoignez le client 🚖");
        else toast.error("Course déjà prise par un autre chauffeur");
      }}
      onDecline={() => { void respond(false); }}
    />
  );
}
