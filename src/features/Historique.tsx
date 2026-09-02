import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ActiveRouteMap } from "@/components/ActiveRouteMap";
import { Star, Share2, Play, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export function Historique() {
  const { rides, drivers, clients, startRide, completeRide, cancelRide, rateRide, markRidePaid, role } = useStore();
  const [pinFor, setPinFor] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [rateFor, setRateFor] = useState<string | null>(null);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");

  const sorted = [...rides].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const handleShare = (token: string, from: string, to: string) => {
    const url = `${window.location.origin}/?trip=${token}`;
    if (navigator.share) {
      navigator.share({ title: "Mon trajet Taxi Proxi", text: `Trajet ${from} → ${to}`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Lien de trajet copié — partagez-le avec un contact de confiance");
    }
  };

  const handleStartSubmit = () => {
    if (!pinFor) return;
    const res = startRide(pinFor, pin);
    if (res.ok) { toast.success(res.msg); setPinFor(null); setPin(""); }
    else toast.error(res.msg);
  };

  const handleRateSubmit = () => {
    if (!rateFor) return;
    rateRide(rateFor, stars, comment.trim() || undefined);
    toast.success("Merci pour votre évaluation");
    setRateFor(null); setStars(5); setComment("");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Historique des courses</h1>
        <p className="text-muted-foreground">Suivi, notation 1-5 ★ et partage de trajet pour la sécurité</p>
      </div>

      {sorted.length === 0 && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Aucune course pour le moment.</CardContent></Card>
      )}

      <div className="space-y-3">
        {sorted.map((r) => {
          const d = drivers.find((x) => x.id === r.driverId);
          const c = clients.find((x) => x.id === r.clientId);
          return (
            <Card key={r.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{r.from} → {r.to}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(r.createdAt).toLocaleString()} · {r.distanceKm} km · {r.durationMin} min
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {(r.status === "pending" || r.status === "ongoing") && (
                  <ActiveRouteMap
                    destination={r.to}
                    fallbackPolyline={r.routePolyline}
                    ride={r}
                    canAdvance={role === "chauffeur" || role === "admin"}
                  />

                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Chauffeur:</span> <b>{d?.name ?? "—"}</b></div>
                  <div><span className="text-muted-foreground">Client:</span> <b>{c?.name ?? "—"}</b></div>
                  <div><span className="text-muted-foreground">Classe:</span> {r.vehicleClass}</div>
                  <div><span className="text-muted-foreground">Total:</span> <b>{r.total} XAF</b> {r.paid ? "💵 payé" : "(à payer cash)"}</div>
                </div>

                {r.status === "pending" && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 text-xs flex items-center justify-between">
                    <span>🔐 PIN de départ : <b className="text-lg tracking-widest">{r.startPin}</b></span>
                    <span className="text-muted-foreground">À donner au chauffeur</span>
                  </div>
                )}

                {r.driverRating && (
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: r.driverRating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                    {r.ratingComment && <span className="text-xs text-muted-foreground ml-2">"{r.ratingComment}"</span>}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleShare(r.shareToken, r.from, r.to)}>
                    <Share2 className="h-3 w-3 mr-1" /> Partager le trajet
                  </Button>
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => { setPinFor(r.id); setPin(""); }}>
                        <Play className="h-3 w-3 mr-1" /> Démarrer (PIN)
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { cancelRide(r.id); toast("Course annulée"); }}>
                        <XCircle className="h-3 w-3 mr-1" /> Annuler
                      </Button>
                    </>
                  )}
                  {r.status === "ongoing" && (
                    <Button size="sm" onClick={() => { completeRide(r.id); toast.success("Course terminée"); }}>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Terminer
                    </Button>
                  )}
                  {r.status === "completed" && !r.paid && (role === "chauffeur" || role === "admin") && (
                    <Button size="sm" onClick={() => { markRidePaid(r.id); toast.success("Paiement cash confirmé"); }}>
                      💵 Confirmer paiement cash
                    </Button>
                  )}
                  {r.status === "completed" && !r.driverRating && (
                    <Button size="sm" variant="outline" onClick={() => { setRateFor(r.id); setStars(5); setComment(""); }}>
                      <Star className="h-3 w-3 mr-1" /> Noter le chauffeur
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!pinFor} onOpenChange={(o) => !o && setPinFor(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Démarrage sécurisé</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Le chauffeur saisit le PIN à 4 chiffres donné par le client.</p>
          <input
            value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric" maxLength={4} autoFocus
            className="w-full text-center text-2xl tracking-[0.5em] font-bold border rounded-lg p-3"
            placeholder="••••"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPinFor(null)}>Annuler</Button>
            <Button onClick={handleStartSubmit}>Démarrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rateFor} onOpenChange={(o) => !o && setRateFor(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Notez le chauffeur</DialogTitle></DialogHeader>
          <div className="flex justify-center gap-1 py-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setStars(n)} type="button" aria-label={`${n} étoiles`}>
                <Star className={`h-9 w-9 ${n <= stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value.slice(0, 240))} placeholder="Commentaire (facultatif)" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRateFor(null)}>Annuler</Button>
            <Button onClick={handleRateSubmit}>Envoyer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "En attente", cls: "bg-amber-500" },
    ongoing: { label: "En cours", cls: "bg-blue-500" },
    completed: { label: "Terminée", cls: "bg-green-600" },
    cancelled: { label: "Annulée", cls: "bg-zinc-500" },
  };
  const m = map[status] ?? map.pending;
  return <Badge className={`${m.cls} text-white hover:${m.cls}`}>{m.label}</Badge>;
}
