
CREATE TYPE public.pricing_vehicle_category AS ENUM ('bend_skin', 'eco', 'confort');

CREATE TABLE public.pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_category public.pricing_vehicle_category NOT NULL UNIQUE,
  price_per_km numeric NOT NULL CHECK (price_per_km >= 0),
  price_per_min numeric NOT NULL CHECK (price_per_min >= 0),
  minimum_fare numeric NOT NULL CHECK (minimum_fare >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pricing_rules TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pricing_rules TO authenticated;
GRANT ALL ON public.pricing_rules TO service_role;

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read pricing rules"
  ON public.pricing_rules FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert pricing rules"
  ON public.pricing_rules FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pricing rules"
  ON public.pricing_rules FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete pricing rules"
  ON public.pricing_rules FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER pricing_rules_touch_updated_at
  BEFORE UPDATE ON public.pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.pricing_rules (vehicle_category, price_per_km, price_per_min, minimum_fare) VALUES
  ('bend_skin', 120, 15, 300),
  ('eco', 180, 25, 500),
  ('confort', 250, 35, 800);
