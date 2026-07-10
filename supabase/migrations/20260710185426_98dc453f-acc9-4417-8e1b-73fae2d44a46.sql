
-- ENUMS
CREATE TYPE public.driver_subscription_status AS ENUM ('active','expiree','en_attente_verification');
CREATE TYPE public.subscription_payment_status AS ENUM ('en_attente','approuve','rejete');
CREATE TYPE public.driver_sub_state AS ENUM ('essai_gratuit','active','expiree');

-- subscription_plans
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_xaf numeric NOT NULL CHECK (price_xaf >= 0),
  duration_days integer NOT NULL DEFAULT 30 CHECK (duration_days > 0),
  description text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans visibles à tous" ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "Admins gèrent les plans" ON public.subscription_plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_subplans_touch BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- driver_subscriptions
CREATE TABLE public.driver_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  status public.driver_subscription_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_driver_subs_driver ON public.driver_subscriptions(driver_id, end_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_subscriptions TO authenticated;
GRANT ALL ON public.driver_subscriptions TO service_role;
ALTER TABLE public.driver_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chauffeur voit ses abonnements" ON public.driver_subscriptions FOR SELECT TO authenticated
  USING (driver_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins gèrent les abonnements" ON public.driver_subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_driversubs_touch BEFORE UPDATE ON public.driver_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- subscription_payments
CREATE TABLE public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  amount_xaf numeric NOT NULL CHECK (amount_xaf >= 0),
  payment_method text NOT NULL DEFAULT 'orange_money',
  transaction_reference text NOT NULL,
  proof_screenshot_url text,
  status public.subscription_payment_status NOT NULL DEFAULT 'en_attente',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  verified_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sub_payments_status ON public.subscription_payments(status, submitted_at DESC);
CREATE INDEX idx_sub_payments_driver ON public.subscription_payments(driver_id, submitted_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.subscription_payments TO authenticated;
GRANT ALL ON public.subscription_payments TO service_role;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chauffeur voit ses paiements" ON public.subscription_payments FOR SELECT TO authenticated
  USING (driver_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Chauffeur crée son paiement" ON public.subscription_payments FOR INSERT TO authenticated
  WITH CHECK (driver_id = auth.uid() AND status = 'en_attente');
CREATE POLICY "Admins gèrent les paiements" ON public.subscription_payments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_subpay_touch BEFORE UPDATE ON public.subscription_payments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- payment_settings (singleton)
CREATE TABLE public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orange_money_number text NOT NULL,
  instructions text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Paramètres visibles aux connectés" ON public.payment_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins modifient les paramètres" ON public.payment_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_paysettings_touch BEFORE UPDATE ON public.payment_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Extend drivers
ALTER TABLE public.drivers
  ADD COLUMN free_rides_remaining integer NOT NULL DEFAULT 10,
  ADD COLUMN subscription_status public.driver_sub_state NOT NULL DEFAULT 'essai_gratuit';

-- Approve payment function: creates subscription + updates driver
CREATE OR REPLACE FUNCTION public.approve_subscription_payment(_payment_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.subscription_payments%ROWTYPE;
  v_plan public.subscription_plans%ROWTYPE;
  v_sub_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  SELECT * INTO v_payment FROM public.subscription_payments WHERE id = _payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
  IF v_payment.status <> 'en_attente' THEN RAISE EXCEPTION 'Payment already processed'; END IF;
  SELECT * INTO v_plan FROM public.subscription_plans WHERE id = v_payment.plan_id;

  INSERT INTO public.driver_subscriptions(driver_id, plan_id, start_date, end_date, status)
  VALUES (v_payment.driver_id, v_payment.plan_id, now(), now() + make_interval(days => v_plan.duration_days), 'active')
  RETURNING id INTO v_sub_id;

  UPDATE public.subscription_payments
    SET status='approuve', verified_at=now(), verified_by=auth.uid()
    WHERE id = _payment_id;

  UPDATE public.drivers SET subscription_status='active', updated_at=now()
    WHERE user_id = v_payment.driver_id;

  RETURN v_sub_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.approve_subscription_payment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_subscription_payment(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.reject_subscription_payment(_payment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.subscription_payments
    SET status='rejete', verified_at=now(), verified_by=auth.uid()
    WHERE id = _payment_id AND status='en_attente';
END $$;
REVOKE EXECUTE ON FUNCTION public.reject_subscription_payment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_subscription_payment(uuid) TO authenticated;

-- Daily expiry sweep
CREATE OR REPLACE FUNCTION public.expire_driver_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.driver_subscriptions SET status='expiree', updated_at=now()
    WHERE status='active' AND end_date < now();
  UPDATE public.drivers d SET subscription_status='expiree', updated_at=now()
    WHERE d.subscription_status='active'
      AND NOT EXISTS (
        SELECT 1 FROM public.driver_subscriptions s
        WHERE s.driver_id = d.user_id AND s.status='active' AND s.end_date > now()
      );
END $$;
REVOKE EXECUTE ON FUNCTION public.expire_driver_subscriptions() FROM PUBLIC, anon, authenticated;

-- Ride consumption helper (called after completed ride)
CREATE OR REPLACE FUNCTION public.consume_free_ride(_driver_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_remaining integer;
BEGIN
  IF auth.uid() <> _driver_id AND NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  UPDATE public.drivers
    SET free_rides_remaining = GREATEST(free_rides_remaining - 1, 0),
        subscription_status = CASE
          WHEN subscription_status='essai_gratuit' AND free_rides_remaining - 1 <= 0 THEN 'expiree'::driver_sub_state
          ELSE subscription_status
        END,
        updated_at = now()
    WHERE user_id = _driver_id AND subscription_status='essai_gratuit'
    RETURNING free_rides_remaining INTO v_remaining;
  RETURN COALESCE(v_remaining, -1);
END $$;
REVOKE EXECUTE ON FUNCTION public.consume_free_ride(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_free_ride(uuid) TO authenticated;

-- Seed
INSERT INTO public.subscription_plans (name, price_xaf, duration_days, description) VALUES
  ('Standard', 3000, 30, 'Accès complet à la plateforme pendant 30 jours'),
  ('Premium', 5000, 30, 'Accès complet + priorité sur les nouvelles courses pendant 30 jours');

INSERT INTO public.payment_settings (orange_money_number, instructions) VALUES
  ('694839546', 'Envoyez le montant exact via Orange Money au numéro ci-dessus, puis saisissez la référence de transaction reçue par SMS.');
