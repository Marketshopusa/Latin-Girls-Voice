
-- Fix: Replace user_metadata reference with a dedicated table + SECURITY DEFINER function

-- Create age verifications table
CREATE TABLE public.user_age_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_age_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification" ON public.user_age_verifications
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own verification" ON public.user_age_verifications
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- SECURITY DEFINER function to check age verification (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_age_verified(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_age_verifications WHERE user_id = _user_id
  )
$$;

-- Update NSFW policy to use the function instead of user_metadata
DROP POLICY IF EXISTS "Verified adults can view NSFW characters" ON public.characters;
CREATE POLICY "Verified adults can view NSFW characters"
ON public.characters FOR SELECT TO authenticated
USING (
  is_public = true 
  AND nsfw = true 
  AND public.is_age_verified(auth.uid())
);
