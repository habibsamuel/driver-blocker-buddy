
-- Enums
CREATE TYPE public.driver_verification_status AS ENUM ('incomplet', 'en_attente', 'verifie', 'rejete');
CREATE TYPE public.driver_document_type AS ENUM ('cni', 'permis_conduire', 'carte_grise', 'assurance', 'photo_vehicule');
CREATE TYPE public.driver_document_status AS ENUM ('en_attente', 'approuve', 'rejete');
CREATE TYPE public.driver_vehicle_class AS ENUM ('moto', 'eco', 'confort');

CREATE TABLE public.drivers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  zone text NOT NULL DEFAULT '',
  vehicle text NOT NULL DEFAULT '',
  plate text NOT NULL DEFAULT '',
  vehicle_class public.driver_vehicle_class NOT NULL DEFAULT 'eco',
  access_pin_hash text,
  verification_status public.driver_verification_status NOT NULL DEFAULT 'incomplet',
  is_online boolean NOT NULL DEFAULT false,
  blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Driver reads own row" ON public.drivers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Driver inserts own row" ON public.drivers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Driver updates own row" ON public.drivers
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all drivers" ON public.drivers
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update all drivers" ON public.drivers
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users see verified online drivers" ON public.drivers
  FOR SELECT TO authenticated USING (verification_status = 'verifie' AND is_online = true AND blocked = false);

CREATE TRIGGER drivers_touch_updated BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.driver_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(user_id) ON DELETE CASCADE,
  document_type public.driver_document_type NOT NULL,
  file_url text NOT NULL,
  status public.driver_document_status NOT NULL DEFAULT 'en_attente',
  rejection_reason text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(driver_id, document_type)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_documents TO authenticated;
GRANT ALL ON public.driver_documents TO service_role;

ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Driver reads own documents" ON public.driver_documents
  FOR SELECT TO authenticated USING (auth.uid() = driver_id);
CREATE POLICY "Driver inserts own documents" ON public.driver_documents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Driver updates own documents" ON public.driver_documents
  FOR UPDATE TO authenticated USING (auth.uid() = driver_id) WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Driver deletes own documents" ON public.driver_documents
  FOR DELETE TO authenticated USING (auth.uid() = driver_id);
CREATE POLICY "Admins read all documents" ON public.driver_documents
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update all documents" ON public.driver_documents
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX driver_documents_driver_idx ON public.driver_documents(driver_id);
CREATE INDEX driver_documents_status_idx ON public.driver_documents(status);

CREATE OR REPLACE FUNCTION public.refresh_driver_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver uuid;
  v_approved int;
  v_pending int;
  v_rejected int;
BEGIN
  v_driver := COALESCE(NEW.driver_id, OLD.driver_id);
  SELECT
    COUNT(*) FILTER (WHERE status = 'approuve'),
    COUNT(*) FILTER (WHERE status = 'en_attente'),
    COUNT(*) FILTER (WHERE status = 'rejete')
  INTO v_approved, v_pending, v_rejected
  FROM public.driver_documents
  WHERE driver_id = v_driver;

  UPDATE public.drivers SET verification_status =
    CASE
      WHEN v_approved >= 5 THEN 'verifie'::driver_verification_status
      WHEN v_rejected > 0 THEN 'rejete'::driver_verification_status
      WHEN v_pending > 0 THEN 'en_attente'::driver_verification_status
      ELSE 'incomplet'::driver_verification_status
    END,
    updated_at = now()
  WHERE user_id = v_driver;

  RETURN NULL;
END $$;

CREATE TRIGGER driver_documents_refresh_status
AFTER INSERT OR UPDATE OR DELETE ON public.driver_documents
FOR EACH ROW EXECUTE FUNCTION public.refresh_driver_verification();

-- Storage policies for driver-documents bucket. Path = {user_id}/{document_type}.<ext>
CREATE POLICY "Driver reads own driver-documents files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'driver-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Driver uploads own driver-documents files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'driver-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Driver updates own driver-documents files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'driver-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Driver deletes own driver-documents files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'driver-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins manage all driver-documents files" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'driver-documents' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'driver-documents' AND public.has_role(auth.uid(), 'admin'));
