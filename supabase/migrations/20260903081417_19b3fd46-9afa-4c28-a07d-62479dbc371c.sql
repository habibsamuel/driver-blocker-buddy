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
     AND d.verification_status = 'verifie'::public.driver_verification_status
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