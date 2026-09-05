import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { deleteMyAccount } from "@/lib/account.functions";

/** Suppression du compte depuis l'application (obligatoire pour le Play Store). */
export function DeleteAccount() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const remove = useServerFn(deleteMyAccount);
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  async function handleDelete() {
    setBusy(true);
    try {
      await remove({ data: undefined as never });
      await supabase.auth.signOut();
      try {
        localStorage.clear();
      } catch {
        /* stockage indisponible */
      }
      toast.success("Votre compte et vos données ont été supprimés.");
      navigate({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Suppression impossible, réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-2">
          <Trash2 className="h-4 w-4" /> Supprimer mon compte
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer définitivement votre compte ?</AlertDialogTitle>
          <AlertDialogDescription>
            Votre profil, vos courses, vos parrainages et vos documents seront effacés. Cette action
            est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction disabled={busy} onClick={handleDelete}>
            {busy ? "Suppression…" : "Oui, supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
