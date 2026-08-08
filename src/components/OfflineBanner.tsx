import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Bandeau discret affiché quand l'appareil perd la connexion. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] flex items-center justify-center gap-2 bg-foreground/90 px-4 py-2 text-xs font-medium text-background">
      <WifiOff className="h-3.5 w-3.5" />
      Mode hors-ligne — les dernières données enregistrées sont affichées
    </div>
  );
}
