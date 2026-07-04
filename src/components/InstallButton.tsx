import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallButton() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !("MSStream" in window));
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore iOS
      window.navigator.standalone === true;
    setInstalled(standalone);
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") toast.success("Installation en cours…");
      setDeferred(null);
      return;
    }
    if (isIOS) {
      toast.info(
        "Sur iPhone : appuyez sur Partager ⤴️ puis « Sur l'écran d'accueil »",
        { duration: 6000 }
      );
      return;
    }
    toast.info(
      "Sur Android : ouvrez le menu Chrome ⋮ puis « Installer l'application »",
      { duration: 6000 }
    );
  };

  return (
    <Button
      onClick={handleClick}
      size="sm"
      className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2"
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Installer l'app</span>
    </Button>
  );
}
