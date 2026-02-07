
-- Fix: Remove public anonymous SELECT policies from characters base table
-- to prevent exposing creator_id. Public reads must go through characters_public view.

-- Drop the public-facing SELECT policies that expose creator_id
DROP POLICY IF EXISTS "Anyone can view public SFW characters" ON public.characters;
DROP POLICY IF EXISTS "Verified adults can view NSFW characters" ON public.characters;

-- Recreate the characters_public view WITHOUT security_invoker
-- so it can bypass RLS and serve public reads (without creator_id)
DROP VIEW IF EXISTS public.characters_public;
CREATE VIEW public.characters_public AS
SELECT
  id, name, tagline, history, welcome_message,
  age, nsfw, is_public, voice, image_url,
  created_at, updated_at
FROM public.characters
WHERE is_public = true;

-- Grant read access on the view to anon and authenticated roles
GRANT SELECT ON public.characters_public TO anon, authenticated;
