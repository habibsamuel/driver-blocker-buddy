
-- Profiles: remove public read, require auth
DROP POLICY IF EXISTS "Profiles public read" ON public.profiles;
CREATE POLICY "Profiles authenticated read"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Driver positions: require auth
DROP POLICY IF EXISTS "Anyone can see online drivers" ON public.driver_positions;
CREATE POLICY "Authenticated can see online drivers"
ON public.driver_positions FOR SELECT
TO authenticated
USING (is_online = true);
