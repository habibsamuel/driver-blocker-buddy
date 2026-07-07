import type { Database } from "@/integrations/supabase/types";

export type DocumentType = Database["public"]["Enums"]["driver_document_type"];
export type DocumentStatus = Database["public"]["Enums"]["driver_document_status"];
export type VerificationStatus = Database["public"]["Enums"]["driver_verification_status"];

export const REQUIRED_DOCS: { type: DocumentType; label: string; hint: string }[] = [
  { type: "cni", label: "Carte Nationale d'Identité", hint: "Recto de votre CNI, bien lisible" },
  { type: "permis_conduire", label: "Permis de conduire", hint: "Recto du permis en cours de validité" },
  { type: "carte_grise", label: "Carte grise du véhicule", hint: "Carte grise complète et lisible" },
  { type: "assurance", label: "Attestation d'assurance", hint: "Attestation en cours de validité" },
  { type: "photo_vehicule", label: "Photo du véhicule", hint: "Vue extérieure claire avec plaque visible" },
];

export const STATUS_LABEL: Record<DocumentStatus, string> = {
  en_attente: "En attente",
  approuve: "Approuvé",
  rejete: "Rejeté",
};

export const VERIF_LABEL: Record<VerificationStatus, string> = {
  incomplet: "Documents à envoyer",
  en_attente: "En cours de vérification",
  verifie: "Vérifié",
  rejete: "Documents rejetés",
};

export const BUCKET = "driver-documents";
