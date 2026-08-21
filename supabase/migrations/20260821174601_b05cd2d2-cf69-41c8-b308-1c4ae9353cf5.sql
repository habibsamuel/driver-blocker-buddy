-- 1) Notation chauffeurs
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS rating numeric(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.driver_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  client_id uuid NOT NULL DEFAULT auth.uid(),
  stars integer NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.driver_ratings TO authenticated;
GRANT ALL ON public.driver_ratings TO service_role;
ALTER TABLE public.driver_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients insert own ratings" ON public.driver_ratings;
CREATE POLICY "clients insert own ratings" ON public.driver_ratings
  FOR INSERT TO authenticated WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "read own or driver ratings" ON public.driver_ratings;
CREATE POLICY "read own or driver ratings" ON public.driver_ratings
  FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR driver_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.refresh_driver_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.drivers d
     SET rating = COALESCE((SELECT round(avg(stars)::numeric, 2) FROM public.driver_ratings r WHERE r.driver_id = NEW.driver_id), 0),
         review_count = (SELECT count(*) FROM public.driver_ratings r WHERE r.driver_id = NEW.driver_id)
   WHERE d.user_id = NEW.driver_id;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.refresh_driver_rating() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_refresh_driver_rating ON public.driver_ratings;
CREATE TRIGGER trg_refresh_driver_rating
AFTER INSERT ON public.driver_ratings
FOR EACH ROW EXECUTE FUNCTION public.refresh_driver_rating();

-- 2) Dispatch temps réel (appel style WhatsApp)
DO $$ BEGIN
  CREATE TYPE public.ride_request_status AS ENUM ('searching','accepted','expired','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ride_offer_status AS ENUM ('ringing','accepted','declined','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.ride_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL DEFAULT auth.uid(),
  client_name text NOT NULL DEFAULT '',
  client_phone text NOT NULL DEFAULT '',
  origin_lat double precision NOT NULL,
  origin_lng double precision NOT NULL,
  destination text NOT NULL,
  distance_km numeric(8,2) NOT NULL DEFAULT 0,
  duration_min integer NOT NULL DEFAULT 0,
  vehicle_class public.driver_vehicle_class NOT NULL DEFAULT 'eco',
  fare integer NOT NULL DEFAULT 0,
  status public.ride_request_status NOT NULL DEFAULT 'searching',
  driver_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '45 seconds',
  accepted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.ride_request_offers (
  request_id uuid NOT NULL REFERENCES public.ride_requests(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL,
  status public.ride_offer_status NOT NULL DEFAULT 'ringing',
  distance_km numeric(8,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  PRIMARY KEY (request_id, driver_id)
);

GRANT SELECT, INSERT, UPDATE ON public.ride_requests TO authenticated;
GRANT ALL ON public.ride_requests TO service_role;
GRANT SELECT ON public.ride_request_offers TO authenticated;
GRANT ALL ON public.ride_request_offers TO service_role;

ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_request_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients create requests" ON public.ride_requests;
CREATE POLICY "clients create requests" ON public.ride_requests
  FOR INSERT TO authenticated WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "client or ringing driver reads request" ON public.ride_requests;
CREATE POLICY "client or ringing driver reads request" ON public.ride_requests
  FOR SELECT TO authenticated
  USING (
    client_id = auth.uid()
    OR driver_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.ride_request_offers o WHERE o.request_id = id AND o.driver_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "client cancels own request" ON public.ride_requests;
CREATE POLICY "client cancels own request" ON public.ride_requests
  FOR UPDATE TO authenticated USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "driver reads own offers" ON public.ride_request_offers;
CREATE POLICY "driver reads own offers" ON public.ride_request_offers
  FOR SELECT TO authenticated
  USING (driver_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Sonne les chauffeurs en ligne dans un rayon de 2 km
CREATE OR REPLACE FUNCTION public.dispatch_ride_request(_request_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req public.ride_requests;
  n integer := 0;
BEGIN
  SELECT * INTO req FROM public.ride_requests WHERE id = _request_id;
  IF req IS NULL OR req.client_id <> auth.uid() THEN
    RAISE EXCEPTION 'Requête introuvable';
  END IF;

  INSERT INTO public.ride_request_offers (request_id, driver_id, distance_km)
  SELECT req.id, p.driver_id,
         round((2 * 6371 * asin(sqrt(
           power(sin(radians(p.lat - req.origin_lat) / 2), 2) +
           cos(radians(req.origin_lat)) * cos(radians(p.lat)) *
           power(sin(radians(p.lng - req.origin_lng) / 2), 2)
         )))::numeric, 2)
    FROM public.driver_positions p
    JOIN public.drivers d ON d.user_id = p.driver_id
   WHERE p.is_online
     AND d.is_online
     AND NOT d.blocked
     AND d.verification_status = 'verified'
     AND d.vehicle_class = req.vehicle_class
     AND p.updated_at > now() - interval '5 minutes'
     AND (2 * 6371 * asin(sqrt(
           power(sin(radians(p.lat - req.origin_lat) / 2), 2) +
           cos(radians(req.origin_lat)) * cos(radians(p.lat)) *
           power(sin(radians(p.lng - req.origin_lng) / 2), 2)
         ))) <= 2
  ON CONFLICT DO NOTHING;

  SELECT count(*) INTO n FROM public.ride_request_offers WHERE request_id = req.id;
  RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.dispatch_ride_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dispatch_ride_request(uuid) TO authenticated;

-- Le premier chauffeur qui accepte gagne ; les autres sonneries se ferment
CREATE OR REPLACE FUNCTION public.respond_ride_request(_request_id uuid, _accept boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  won boolean := false;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.ride_request_offers WHERE request_id = _request_id AND driver_id = auth.uid()) THEN
    RETURN false;
  END IF;

  IF NOT _accept THEN
    UPDATE public.ride_request_offers
       SET status = 'declined', responded_at = now()
     WHERE request_id = _request_id AND driver_id = auth.uid() AND status = 'ringing';
    RETURN false;
  END IF;

  UPDATE public.ride_requests
     SET status = 'accepted', driver_id = auth.uid(), accepted_at = now()
   WHERE id = _request_id AND status = 'searching' AND expires_at > now();

  won := FOUND;

  IF won THEN
    UPDATE public.ride_request_offers
       SET status = CASE WHEN driver_id = auth.uid() THEN 'accepted'::public.ride_offer_status ELSE 'expired'::public.ride_offer_status END,
           responded_at = now()
     WHERE request_id = _request_id AND status = 'ringing';
  END IF;

  RETURN won;
END;
$$;
REVOKE ALL ON FUNCTION public.respond_ride_request(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_ride_request(uuid, boolean) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_request_offers;
ALTER TABLE public.ride_requests REPLICA IDENTITY FULL;
ALTER TABLE public.ride_request_offers REPLICA IDENTITY FULL;