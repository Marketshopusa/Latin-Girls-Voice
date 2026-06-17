CREATE OR REPLACE VIEW public.characters_public
WITH (security_invoker = false) AS
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