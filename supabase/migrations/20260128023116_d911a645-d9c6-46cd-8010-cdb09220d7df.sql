-- Fix RLS so any visitor can create characters (SFW/NSFW) and they persist in the gallery
-- NOTE: NSFW visibility gating is handled in the UI (age-confirm + toggle).

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (they were blocking inserts for anon users)
DROP POLICY IF EXISTS "Anyone can create characters" ON public.characters;
DROP POLICY IF EXISTS "Anyone can view public SFW characters" ON public.characters;
DROP POLICY IF EXISTS "Authenticated users can view NSFW characters" ON public.characters;
DROP POLICY IF EXISTS "Users can view own characters" ON public.characters;
DROP POLICY IF EXISTS "Users can update own characters" ON public.characters;
DROP POLICY IF EXISTS "Users can delete own characters" ON public.characters;

-- INSERT: allow anyone (anon + authenticated)
CREATE POLICY "Anyone can create characters"
ON public.characters
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (true);

-- SELECT: public gallery (SFW)
CREATE POLICY "Anyone can view public SFW characters"
ON public.characters
AS PERMISSIVE
FOR SELECT
TO public
USING (is_public = true AND nsfw = false);

-- SELECT: public gallery (NSFW) - UI gate handles age confirmation
CREATE POLICY "Anyone can view public NSFW characters"
ON public.characters
AS PERMISSIVE
FOR SELECT
TO public
USING (is_public = true AND nsfw = true);

-- SELECT: authenticated can also see their own (private/non-public) if added later
CREATE POLICY "Users can view own characters"
ON public.characters
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (creator_id = auth.uid());

-- UPDATE/DELETE: only authenticated owners
CREATE POLICY "Users can update own characters"
ON public.characters
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can delete own characters"
ON public.characters
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (creator_id = auth.uid());
