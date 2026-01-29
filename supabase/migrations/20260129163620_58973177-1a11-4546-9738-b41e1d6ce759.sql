-- 1. Eliminar política actual de NSFW público
DROP POLICY IF EXISTS "Anyone can view public NSFW characters" ON public.characters;

-- 2. Nueva política: Solo usuarios autenticados pueden ver NSFW
CREATE POLICY "Authenticated users can view public NSFW characters" 
ON public.characters FOR SELECT
TO authenticated
USING ((is_public = true) AND (nsfw = true));

-- 3. Crear vista pública que oculta creator_id para personajes públicos
CREATE OR REPLACE VIEW public.characters_public
WITH (security_invoker = true) AS
SELECT 
  id,
  name,
  tagline,
  history,
  welcome_message,
  voice,
  age,
  nsfw,
  is_public,
  image_url,
  created_at,
  updated_at
  -- creator_id EXCLUIDO intencionalmente para privacidad
FROM public.characters
WHERE is_public = true;