REVOKE SELECT ON public.characters FROM anon, authenticated;
REVOKE ALL ON public.characters FROM anon, authenticated;

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

GRANT INSERT, UPDATE, DELETE ON public.characters TO authenticated;
GRANT ALL ON public.characters TO service_role;

GRANT SELECT ON public.characters_public TO anon, authenticated;
GRANT ALL ON public.characters_public TO service_role;