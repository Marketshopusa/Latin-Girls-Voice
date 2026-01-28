-- Tighten INSERT policy to avoid overly-permissive (true) while still allowing anon creation

DROP POLICY IF EXISTS "Anyone can create characters" ON public.characters;

CREATE POLICY "Anyone can create characters"
ON public.characters
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (
  is_public = true
  AND age >= 18
  AND (
    creator_id IS NULL
    OR creator_id = auth.uid()
  )
);
