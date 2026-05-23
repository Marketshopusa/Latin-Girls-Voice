
-- 1) Privilege escalation fix: remove self-insert on user_promo_redemptions.
-- Inserts will only happen via the validate-promo-code edge function using the service role (bypasses RLS).
DROP POLICY IF EXISTS "Users can insert own redemptions" ON public.user_promo_redemptions;
DROP POLICY IF EXISTS "Users can update own redemptions" ON public.user_promo_redemptions;

-- 2) Add explicit admin-only management policies on promo_codes so the table is not RLS-enabled with zero policies.
CREATE POLICY "Admins can view promo codes"
ON public.promo_codes FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert promo codes"
ON public.promo_codes FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update promo codes"
ON public.promo_codes FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete promo codes"
ON public.promo_codes FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));
