import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { BUCKET, REQUIRED_DOCS, VERIF_LABEL } from "@/lib/driverDocs";
import type { Database } from "@/integrations/supabase/types";

type DriverRow = Database["public"]["Tables"]["drivers"]["Row"];
type DocRow = Database["public"]["Tables"]["driver_documents"]["Row"];

export function AdminVerifications() {
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [docs, setDocs] = useState<Record<string, DocRow[]>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [reason, setReason] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDrivers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .in("verification_status", ["en_attente", "incomplet", "rejete"])
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setDrivers(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadDrivers();
  }, []);

  const openDriver = async (id: string) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    const { data } = await supabase.from("driver_documents").select("*").eq("driver_id", id);
    setDocs((m) => ({ ...m, [id]: data ?? [] }));
    if (data?.length) {
      const urls: Record<string, string> = {};
      await Promise.all(
        data.map(async (row) => {
          const { data: sd } = await supabase.storage.from(BUCKET).createSignedUrl(row.file_url, 3600);
          if (sd?.signedUrl) urls[row.id] = sd.signedUrl;
        }),
      );
      setPreviews((p) => ({ ...p, ...urls }));
    }
  };

  const review = async (doc: DocRow, action: "approuve" | "rejete") => {
    setBusy(doc.id);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      const patch: Partial<DocRow> = {
        status: action,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id ?? null,
        rejection_reason: action === "rejete" ? reason[doc.id]?.trim() || "Non conforme" : null,
      };
      const { error } = await supabase.from("driver_documents").update(patch).eq("id", doc.id);
      if (error) throw error;
      toast.success(action === "approuve" ? "Document approuvé" : "Document rejeté");
      // reload docs for this driver
      const { data } = await supabase.from("driver_documents").select("*").eq("driver_id", doc.driver_id);
      setDocs((m) => ({ ...m, [doc.driver_id]: data ?? [] }));
      await loadDrivers();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vérifications chauffeurs ({drivers.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {!loading && drivers.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun chauffeur en attente de vérification.</p>
        )}
        {drivers.map((d) => (
          <div key={d.user_id} className="border rounded-lg">
            <button
              type="button"
              onClick={() => openDriver(d.user_id)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50"
            >
              <div>
                <div className="font-medium">{d.name || "(sans nom)"} — {d.phone}</div>
                <div className="text-xs text-muted-foreground">
                  {d.vehicle} · {d.plate} · {d.zone}
                </div>
              </div>
              <Badge variant={d.verification_status === "en_attente" ? "secondary" : "outline"}>
                {VERIF_LABEL[d.verification_status]}
              </Badge>
            </button>

            {expanded === d.user_id && (
              <div className="p-3 border-t space-y-4">
                {REQUIRED_DOCS.map((meta) => {
                  const doc = (docs[d.user_id] ?? []).find((x) => x.document_type === meta.type);
                  return (
                    <div key={meta.type} className="grid md:grid-cols-[240px_1fr] gap-3">
                      <div>
                        <div className="text-sm font-medium mb-1">{meta.label}</div>
                        {doc && previews[doc.id] ? (
                          <a href={previews[doc.id]} target="_blank" rel="noreferrer">
                            <img
                              src={previews[doc.id]}
                              alt={meta.label}
                              className="w-full h-40 rounded border object-cover cursor-zoom-in"
                            />
                          </a>
                        ) : (
                          <div className="w-full h-40 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            Non envoyé
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        {doc ? (
                          <>
                            <div>
                              <Badge
                                className={
                                  doc.status === "approuve"
                                    ? "bg-green-600 hover:bg-green-600"
                                    : doc.status === "rejete"
                                      ? ""
                                      : ""
                                }
                                variant={
                                  doc.status === "approuve"
                                    ? "default"
                                    : doc.status === "rejete"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {doc.status}
                              </Badge>
                            </div>
                            {doc.rejection_reason && (
                              <p className="text-xs text-muted-foreground">Motif : {doc.rejection_reason}</p>
                            )}
                            <Input
                              placeholder="Motif de rejet (si rejet)"
                              value={reason[doc.id] ?? ""}
                              onChange={(e) => setReason((r) => ({ ...r, [doc.id]: e.target.value }))}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => review(doc, "approuve")}
                                disabled={busy === doc.id || doc.status === "approuve"}
                              >
                                {busy === doc.id ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                )}
                                Approuver
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => review(doc, "rejete")}
                                disabled={busy === doc.id}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rejeter
                              </Button>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">Document non fourni</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
