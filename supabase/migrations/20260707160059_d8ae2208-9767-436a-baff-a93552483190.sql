
DROP POLICY IF EXISTS "Authenticated can see online drivers" ON public.driver_positions;
CREATE POLICY "Authenticated see online verified drivers" ON public.driver_positions
  FOR SELECT TO authenticated
  USING (
    is_online = true
    AND EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.user_id = driver_positions.driver_id
        AND d.verification_status = 'verifie'
        AND d.blocked = false
    )
  );
