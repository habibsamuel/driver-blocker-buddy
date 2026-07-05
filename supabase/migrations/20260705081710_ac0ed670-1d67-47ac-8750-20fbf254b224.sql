
-- 1. Colonnes sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid,
  ADD COLUMN IF NOT EXISTS referral_credit integer NOT NULL DEFAULT 0;

-- 2. Fonction de génération de code lisible (TAXI-XXXXXX, alphabet Crockford sans I/O/0/1)
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alphabet text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  code text;
  i int;
  exists_already boolean;
BEGIN
  LOOP
    code := 'TAXI-';
    FOR i IN 1..6 LOOP
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = code) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN code;
END $$;

-- 3. Table referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referee_id uuid NOT NULL UNIQUE,
  code_used text NOT NULL,
  reward_amount integer NOT NULL DEFAULT 500,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referrals_no_self CHECK (referrer_id <> referee_id)
);

GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their referrals as referrer"
  ON public.referrals FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- 4. Nouvelle version de handle_new_user avec parrainage
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_input_code text;
  v_referrer uuid;
  v_reward int := 500;
BEGIN
  v_code := public.generate_referral_code();
  v_input_code := upper(trim(COALESCE(NEW.raw_user_meta_data->>'referral_code','')));

  -- Résoudre le parrain si code fourni
  IF v_input_code <> '' THEN
    SELECT user_id INTO v_referrer
    FROM public.profiles
    WHERE referral_code = v_input_code
    LIMIT 1;
    -- pas d'auto-parrainage
    IF v_referrer = NEW.id THEN
      v_referrer := NULL;
    END IF;
  END IF;

  INSERT INTO public.profiles (user_id, name, phone, referral_code, referred_by, referral_credit)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name',''),
    COALESCE(NEW.raw_user_meta_data->>'phone',''),
    v_code,
    v_referrer,
    CASE WHEN v_referrer IS NOT NULL THEN v_reward ELSE 0 END
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT DO NOTHING;

  -- Créditer le parrain + historique
  IF v_referrer IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referee_id, code_used, reward_amount)
    VALUES (v_referrer, NEW.id, v_input_code, v_reward)
    ON CONFLICT (referee_id) DO NOTHING;

    UPDATE public.profiles
    SET referral_credit = referral_credit + v_reward
    WHERE user_id = v_referrer;
  END IF;

  RETURN NEW;
END $$;

-- 5. S'assurer que le trigger existe sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Backfill : générer un code pour les profils existants
UPDATE public.profiles
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL;

-- 7. Fonction utilitaire : vérifier qu'un code existe (utilisée côté inscription)
CREATE OR REPLACE FUNCTION public.referral_code_exists(_code text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles
    WHERE referral_code = upper(trim(_code))
  )
$$;

GRANT EXECUTE ON FUNCTION public.referral_code_exists(text) TO anon, authenticated;
