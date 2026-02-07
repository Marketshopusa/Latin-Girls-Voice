
-- =====================================================
-- SECURITY FIX #1: Recreate characters_public view with security_invoker
-- This ensures RLS policies on the base table are applied when querying the view
-- =====================================================
DROP VIEW IF EXISTS public.characters_public;
CREATE VIEW public.characters_public
WITH (security_invoker = on) AS
SELECT id, name, tagline, history, welcome_message, voice, age, nsfw, is_public, image_url, created_at, updated_at
FROM public.characters
WHERE is_public = true;

-- =====================================================
-- SECURITY FIX #2: Update NSFW policy to require server-side age verification
-- Age verification is stored in user_metadata via supabase.auth.updateUser()
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view public NSFW characters" ON public.characters;
CREATE POLICY "Verified adults can view NSFW characters"
ON public.characters FOR SELECT TO authenticated
USING (
  is_public = true 
  AND nsfw = true 
  AND COALESCE((auth.jwt() -> 'user_metadata' ->> 'age_verified')::boolean, false) = true
);

-- =====================================================
-- SECURITY FIX #3: Require authentication for storage uploads
-- =====================================================
DROP POLICY IF EXISTS "Anyone can upload character images" ON storage.objects;
CREATE POLICY "Authenticated users can upload character images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'character-images');

-- =====================================================
-- SECURITY FIX #4: Add file size and mime type restrictions to storage bucket
-- =====================================================
UPDATE storage.buckets
SET 
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'character-images';
