-- ============ UNLOCK CODES TABLE ============
-- Track driver unlock/subscription codes with expiration

CREATE TABLE public.unlock_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL, -- Will be hashed
  used BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(driver_id, code)
);

-- Indexes
CREATE INDEX idx_unlock_codes_driver_id ON public.unlock_codes(driver_id);
CREATE INDEX idx_unlock_codes_expires_at ON public.unlock_codes(expires_at);

-- RLS
GRANT SELECT, INSERT, UPDATE ON public.unlock_codes TO authenticated;
GRANT ALL ON public.unlock_codes TO service_role;
ALTER TABLE public.unlock_codes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Drivers see own codes" ON public.unlock_codes
  FOR SELECT TO authenticated USING (auth.uid() = driver_id);
CREATE POLICY "Drivers update own codes" ON public.unlock_codes
  FOR UPDATE TO authenticated USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Admins manage unlock codes" ON public.unlock_codes
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ PROMO CODES TABLE ============
-- Network-wide promotional codes

CREATE TABLE public.promo_codes (
  code TEXT PRIMARY KEY,
  percent_off INTEGER NOT NULL CHECK (percent_off BETWEEN 0 AND 100),
  active BOOLEAN DEFAULT true,
  max_uses INTEGER, -- NULL = unlimited
  uses_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_promo_codes_active ON public.promo_codes(active);
CREATE INDEX idx_promo_codes_expires_at ON public.promo_codes(expires_at);

-- RLS
GRANT SELECT ON public.promo_codes TO authenticated, anon;
GRANT INSERT, UPDATE ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can see active promos" ON public.promo_codes
  FOR SELECT USING (active = true AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Admins manage promo codes" ON public.promo_codes
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ AUDIT LOG TABLE ============
-- Track critical actions for security/compliance

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'pin_attempt', 'ride_booked', 'driver_blocked', etc
  resource_type TEXT, -- 'ride', 'driver', 'admin'
  resource_id UUID,
  status TEXT, -- 'success', 'failed', 'blocked'
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- RLS
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins see all audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users see own audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
