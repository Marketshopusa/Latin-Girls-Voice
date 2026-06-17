CREATE OR REPLACE VIEW public.characters_public
WITH (security_invoker = true) AS
SELECT
  id,
  name,
  tagline,
  history,
  welcome_message,
  age,
  nsfw,
  is_public,
  voice,
  image_url,
  created_at,
  updated_at
FROM public.characters
WHERE is_public = true;

GRANT SELECT ON public.characters_public TO anon, authenticated;
GRANT ALL ON public.characters_public TO service_role;

GRANT SELECT (
  id,
  name,
  tagline,
  history,
  welcome_message,
  age,
  nsfw,
  is_public,
  voice,
  image_url,
  created_at,
  updated_at
) ON public.characters TO anon, authenticated;
GRANT ALL ON public.characters TO service_role;

DROP POLICY IF EXISTS "Public can read public characters" ON public.characters;
CREATE POLICY "Public can read public characters"
ON public.characters
FOR SELECT
TO anon, authenticated
USING (is_public = true);