
-- Tabla de códigos promocionales
CREATE TABLE public.promo_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  tts_responses integer NOT NULL DEFAULT 15,
  voice_call_minutes integer NOT NULL DEFAULT 15,
  expires_at timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabla de canjes de código por usuario
CREATE TABLE public.user_promo_redemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  promo_code_id uuid NOT NULL REFERENCES public.promo_codes(id),
  tts_responses_remaining integer NOT NULL DEFAULT 15,
  voice_call_seconds_remaining integer NOT NULL DEFAULT 900,
  redeemed_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  UNIQUE(user_id, promo_code_id)
);

-- RLS para promo_codes (solo lectura pública para validar códigos)
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active promo codes" ON public.promo_codes
  FOR SELECT USING (is_active = true);

-- RLS para user_promo_redemptions
ALTER TABLE public.user_promo_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own redemptions" ON public.user_promo_redemptions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own redemptions" ON public.user_promo_redemptions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own redemptions" ON public.user_promo_redemptions
  FOR UPDATE USING (user_id = auth.uid());
