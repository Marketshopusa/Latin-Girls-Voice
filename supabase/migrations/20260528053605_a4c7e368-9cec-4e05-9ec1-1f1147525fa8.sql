
-- 1. user_usage: remove client INSERT/UPDATE to prevent quota tampering
DROP POLICY IF EXISTS "Users can insert their own usage" ON public.user_usage;
DROP POLICY IF EXISTS "Users can update their own usage" ON public.user_usage;

-- 2. characters: stop exposing creator_id to non-owners; public reads go through characters_public view
DROP POLICY IF EXISTS "Anyone can read public characters or own characters" ON public.characters;
CREATE POLICY "Owners can read their own characters"
  ON public.characters FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid());

GRANT SELECT ON public.characters_public TO anon, authenticated;

-- 3. Storage: tighten character-images policies
-- Remove broad list SELECT (public files still accessible via public URL endpoint)
DROP POLICY IF EXISTS "Anyone can view character images" ON storage.objects;

-- Restrict UPDATE/DELETE to the file's owner (storage.objects.owner is set to auth.uid() on upload)
DROP POLICY IF EXISTS "Users can delete their character images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their character images" ON storage.objects;

CREATE POLICY "Owners can delete their character images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'character-images' AND owner = auth.uid());

CREATE POLICY "Owners can update their character images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'character-images' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'character-images' AND owner = auth.uid());

-- 4. SECURITY DEFINER functions: revoke EXECUTE from anon (and from authenticated where unused)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_age_verified(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_conversation_owner(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) FROM anon, authenticated, PUBLIC;
