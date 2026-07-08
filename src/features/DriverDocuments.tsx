import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Camera, CheckCircle2, Clock, Loader2, RefreshCw, XCircle } from "lucide-react";
import { BUCKET, REQUIRED_DOCS, STATUS_LABEL, VERIF_LABEL, type DocumentType } from "@/lib/driverDocs";
import type { Database } from "@/integrations/supabase/types";

type DriverRow = Database["public"]["Tables"]["drivers"]["Row"];
type DocRow = Database["public"]["Tables"]["driver_documents"]["Row"];

export function DriverDocuments() {
  const { user, loading } = useAuth();
  const { drivers, addDriver } = useStore();
  const [driver, setDriver] = useState<DriverRow | null>(null);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [busy, setBusy] = useState<DocumentType | null>(null);
  const [previews, setPreviews] = useState<Partial<Record<DocumentType, string>>>({});

  // Once the Supabase row is verified, activate the driver in the local fleet.
  useEffect(() => {
    if (!user || !driver) return;
    if (driver.verification_status !== "verifie") return;
    const already = drivers.some((d) => d.phone === driver.phone && d.plate === driver.plate);
    if (already) return;
    let pin = "";
    try { pin = localStorage.getItem(`chauffeur_pin_${user.id}`) ?? ""; } catch { /* ignore */ }
    addDriver({
      name: driver.name,
      phone: driver.phone,
      zone: driver.zone,
      vehicle: driver.vehicle,
      plate: driver.plate,
      vehicleClass: driver.vehicle_class,
      accessPin: pin,
    });
    toast.success("Bienvenue ! Votre compte chauffeur est désormais actif.");
  }, [driver?.verification_status, user?.id]);


  const load = async () => {
    if (!user) return;
    const [d, dd] = await Promise.all([
      supabase.from("drivers").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("driver_documents").select("*").eq("driver_id", user.id),
    ]);
    if (d.data) setDriver(d.data);
    if (dd.data) setDocs(dd.data);
    // Generate signed URLs for previews
    if (dd.data?.length) {
      const map: Partial<Record<DocumentType, string>> = {};
      await Promise.all(
        dd.data.map(async (row) => {
          const path = row.file_url;
          const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
          if (data?.signedUrl) map[row.document_type] = data.signedUrl;
        }),
      );
      setPreviews(map);
    }
  };

  useEffect(() => {
    void load();
  }, [user?.id]);

  if (loading) return <div className="text-center py-10 text-muted-foreground">Chargement…</div>;
  if (!user)
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-3">
        <div className="text-6xl">🔒</div>
        <h1 className="text-2xl font-bold">Connexion requise</h1>
        <p className="text-muted-foreground">Connectez-vous pour envoyer vos documents.</p>
        <Button asChild><a href="/auth">Se connecter</a></Button>
      </div>
    );
  if (!driver)
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-3">
        <h1 className="text-2xl font-bold">Profil chauffeur introuvable</h1>
        <p className="text-muted-foreground">Terminez votre inscription chauffeur d'abord.</p>
        <Button asChild><a href="/inscription-chauffeur">Devenir chauffeur</a></Button>
      </div>
    );

  const upload = async (type: DocumentType, file: File) => {
    setBusy(type);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/${type}.${ext}`;
      const up = await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: true,
        contentType: file.type || "image/jpeg",
      });
      if (up.error) throw up.error;

      // upsert doc row (reset status to en_attente on re-upload)
      const existing = docs.find((d) => d.document_type === type);
      if (existing) {
        const { error } = await supabase
          .from("driver_documents")
          .update({
            file_url: path,
            status: "en_attente",
            rejection_reason: null,
            reviewed_at: null,
            reviewed_by: null,
            uploaded_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("driver_documents").insert({
          driver_id: user.id,
          document_type: type,
          file_url: path,
        });
        if (error) throw error;
      }
      toast.success("Document envoyé, en attente de vérification");
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Échec de l'envoi");
    } finally {
      setBusy(null);
    }
  };

  const allApproved = REQUIRED_DOCS.every(
    (d) => docs.find((x) => x.document_type === d.type)?.status === "approuve",
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vérification de vos documents</h1>
        <p className="text-muted-foreground">
          Statut : <Badge variant={driver.verification_status === "verifie" ? "default" : "secondary"}>
            {VERIF_LABEL[driver.verification_status]}
          </Badge>
        </p>
      </div>

      {driver.verification_status === "verifie" ? (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="pt-6 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-semibold">Compte chauffeur activé.</p>
              <p className="text-sm text-muted-foreground">
                Tous vos documents sont approuvés. Vous pouvez maintenant accéder à votre espace chauffeur et recevoir des courses.
              </p>
              <Button asChild size="sm" className="mt-2"><a href="/chauffeurs">Aller à mon espace</a></Button>
            </div>
          </CardContent>
        </Card>
      ) : allApproved ? (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6 flex items-center gap-3">
            <Clock className="h-6 w-6 text-amber-600" />
            <div>
              <p className="font-semibold">Documents envoyés — en cours de vérification.</p>
              <p className="text-sm text-muted-foreground">
                Un administrateur va examiner vos pièces. Vous serez activé dès approbation.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="pt-6 flex items-center gap-3">
            <Camera className="h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold">Scannez les 5 documents ci-dessous.</p>
              <p className="text-sm text-muted-foreground">
                Votre compte chauffeur ne sera activé qu'une fois toutes les pièces approuvées.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {REQUIRED_DOCS.map((doc) => {
          const row = docs.find((d) => d.document_type === doc.type);
          const status = row?.status;
          const preview = previews[doc.type];
          return (
            <Card key={doc.type}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{doc.label}</span>
                  {status === "approuve" && <Badge className="bg-green-600 hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Approuvé</Badge>}
                  {status === "en_attente" && <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>}
                  {status === "rejete" && <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejeté</Badge>}
                  {!row && <Badge variant="outline">À envoyer</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{doc.hint}</p>
                {status === "rejete" && row?.rejection_reason && (
                  <div className="rounded border border-destructive/50 bg-destructive/5 p-3 text-sm">
                    <b>Motif de rejet :</b> {row.rejection_reason}
                  </div>
                )}
                {preview && (
                  <img
                    src={preview}
                    alt={doc.label}
                    className="max-h-48 rounded border object-cover"
                  />
                )}
                <FilePicker
                  disabled={busy === doc.type}
                  onFile={(f) => upload(doc.type, f)}
                  hasFile={!!row}
                  busy={busy === doc.type}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function FilePicker({
  onFile,
  disabled,
  hasFile,
  busy,
}: {
  onFile: (f: File) => void;
  disabled?: boolean;
  hasFile: boolean;
  busy: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant={hasFile ? "outline" : "default"}
        disabled={disabled}
        onClick={() => ref.current?.click()}
      >
        {busy ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Envoi…</>
        ) : hasFile ? (
          <><RefreshCw className="h-4 w-4 mr-2" />Reprendre / remplacer</>
        ) : (
          <><Camera className="h-4 w-4 mr-2" />Scanner / importer</>
        )}
      </Button>
    </>
  );
}
