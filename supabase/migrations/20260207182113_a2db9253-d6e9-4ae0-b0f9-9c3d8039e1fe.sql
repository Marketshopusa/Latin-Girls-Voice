
-- Fix: Require authentication for character creation to prevent spam
-- Drop the old permissive policy that allows anonymous inserts
DROP POLICY IF EXISTS "Anyone can create characters" ON public.characters;

-- Create new policy requiring authenticated users
CREATE POLICY "Authenticated users can create characters"
ON public.characters FOR INSERT TO authenticated
WITH CHECK (
  is_public = true
  AND age >= 18
  AND creator_id = auth.uid()
);
