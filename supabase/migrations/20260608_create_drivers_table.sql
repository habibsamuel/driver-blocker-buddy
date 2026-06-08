-- ============ DRIVERS TABLE ============
-- Persister les informations drivers (extends profiles pour chauffeurs)

CREATE TABLE public.drivers (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_class TEXT NOT NULL DEFAULT 'eco' CHECK (vehicle_class IN ('eco', 'confort', 'moto')),
  vehicle_model TEXT,
  license_plate TEXT,
  zone TEXT,
  access_pin TEXT NOT NULL, -- Will be hashed
  rating NUMERIC DEFAULT 0,
  ratings_count INTEGER DEFAULT 0,
  clients_this_month INTEGER DEFAULT 0,
  subscription_paid BOOLEAN DEFAULT false,
  blocked BOOLEAN DEFAULT false,
  blocked_reason TEXT,
  threshold_reached_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_drivers_blocked ON public.drivers(blocked);
CREATE INDEX idx_drivers_vehicle_class ON public.drivers(vehicle_class);
CREATE INDEX idx_drivers_zone ON public.drivers(zone);

-- RLS
GRANT SELECT, INSERT, UPDATE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Drivers see own profile" ON public.drivers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Drivers update own profile" ON public.drivers
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage drivers" ON public.drivers
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Auto update updated_at
CREATE TRIGGER drivers_touch_updated_at BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Clients can see online drivers with ratings
CREATE POLICY "Clients see online drivers" ON public.drivers
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'client') AND blocked = false
  );
