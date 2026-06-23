-- Drop existing views, tables, and types if they exist to allow a clean reinstall
DROP VIEW IF EXISTS public.characters_public CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.character_customizations CASCADE;
DROP TABLE IF EXISTS public.user_usage CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.user_age_verifications CASCADE;
DROP TABLE IF EXISTS public.user_promo_redemptions CASCADE;
DROP TABLE IF EXISTS public.promo_codes CASCADE;
DROP TABLE IF EXISTS public.rate_limit_log CASCADE;
DROP TABLE IF EXISTS public.characters CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  character_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  audio_duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user owns a conversation
CREATE OR REPLACE FUNCTION public.is_conversation_owner(conversation_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE id = conversation_uuid
      AND user_id = auth.uid()
  )
$$;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations"
  ON public.conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own conversations"
  ON public.conversations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own conversations"
  ON public.conversations FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "Users can view messages from their conversations"
  ON public.messages FOR SELECT
  USING (public.is_conversation_owner(conversation_id));

CREATE POLICY "Users can create messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (public.is_conversation_owner(conversation_id));

CREATE POLICY "Users can update messages in their conversations"
  ON public.messages FOR UPDATE
  USING (public.is_conversation_owner(conversation_id));

CREATE POLICY "Users can delete messages from their conversations"
  ON public.messages FOR DELETE
  USING (public.is_conversation_owner(conversation_id));

-- Trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
-- Create characters table for storing user-created characters
CREATE TABLE public.characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18),
  tagline TEXT NOT NULL,
  history TEXT NOT NULL,
  welcome_message TEXT NOT NULL,
  voice TEXT NOT NULL DEFAULT 'COLOMBIANA_PAISA',
  nsfw BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Everyone can view public SFW characters
CREATE POLICY "Anyone can view public SFW characters"
ON public.characters
FOR SELECT
USING (is_public = true AND nsfw = false);

-- Authenticated users can view public NSFW characters
CREATE POLICY "Authenticated users can view NSFW characters"
ON public.characters
FOR SELECT
TO authenticated
USING (is_public = true AND nsfw = true);

-- Users can view their own characters
CREATE POLICY "Users can view own characters"
ON public.characters
FOR SELECT
TO authenticated
USING (creator_id = auth.uid());

-- Anyone can create characters (for now, no auth required)
CREATE POLICY "Anyone can create characters"
ON public.characters
FOR INSERT
WITH CHECK (true);

-- Users can update their own characters
CREATE POLICY "Users can update own characters"
ON public.characters
FOR UPDATE
TO authenticated
USING (creator_id = auth.uid());

-- Users can delete their own characters
CREATE POLICY "Users can delete own characters"
ON public.characters
FOR DELETE
TO authenticated
USING (creator_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_characters_updated_at
BEFORE UPDATE ON public.characters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for character images
INSERT INTO storage.buckets (id, name, public) VALUES ('character-images', 'character-images', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for character images
CREATE POLICY "Anyone can view character images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'character-images');

CREATE POLICY "Anyone can upload character images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'character-images');

CREATE POLICY "Users can update their character images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'character-images');

CREATE POLICY "Users can delete their character images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'character-images');
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
-- 1. Eliminar polÃ­tica actual de NSFW pÃºblico
DROP POLICY IF EXISTS "Anyone can view public NSFW characters" ON public.characters;

-- 2. Nueva polÃ­tica: Solo usuarios autenticados pueden ver NSFW
CREATE POLICY "Authenticated users can view public NSFW characters" 
ON public.characters FOR SELECT
TO authenticated
USING ((is_public = true) AND (nsfw = true));

-- 3. Crear vista pÃºblica que oculta creator_id para personajes pÃºblicos
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
-- Tabla para guardar personalizaciones de personajes por usuario
CREATE TABLE public.character_customizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  character_id TEXT NOT NULL,
  history TEXT,
  welcome_message TEXT,
  voice TEXT,
  nsfw BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, character_id)
);

-- Enable RLS
ALTER TABLE public.character_customizations ENABLE ROW LEVEL SECURITY;

-- PolÃ­ticas RLS
CREATE POLICY "Users can view their own customizations"
ON public.character_customizations
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own customizations"
ON public.character_customizations
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own customizations"
ON public.character_customizations
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own customizations"
ON public.character_customizations
FOR DELETE
USING (user_id = auth.uid());

-- Trigger para updated_at
CREATE TRIGGER update_character_customizations_updated_at
BEFORE UPDATE ON public.character_customizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Crear tabla para tracking de uso mensual de usuarios
CREATE TABLE public.user_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month_year TEXT NOT NULL, -- Formato: 'YYYY-MM'
  characters_created INTEGER NOT NULL DEFAULT 0,
  images_generated INTEGER NOT NULL DEFAULT 0,
  conversations_started INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Habilitar RLS
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- PolÃ­ticas RLS para user_usage
CREATE POLICY "Users can view their own usage"
ON public.user_usage FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own usage"
ON public.user_usage FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own usage"
ON public.user_usage FOR UPDATE
USING (user_id = auth.uid());

-- Trigger para actualizar updated_at
CREATE TRIGGER update_user_usage_updated_at
BEFORE UPDATE ON public.user_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- RLS Policies: Only admins can see all roles, users can see their own
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

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

-- Fix: Replace user_metadata reference with a dedicated table + SECURITY DEFINER function

-- Create age verifications table
CREATE TABLE public.user_age_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_age_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification" ON public.user_age_verifications
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own verification" ON public.user_age_verifications
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- SECURITY DEFINER function to check age verification (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_age_verified(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_age_verifications WHERE user_id = _user_id
  )
$$;

-- Update NSFW policy to use the function instead of user_metadata
DROP POLICY IF EXISTS "Verified adults can view NSFW characters" ON public.characters;
CREATE POLICY "Verified adults can view NSFW characters"
ON public.characters FOR SELECT TO authenticated
USING (
  is_public = true 
  AND nsfw = true 
  AND public.is_age_verified(auth.uid())
);

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
-- Fix: Allow anyone to read public characters (not just the creator)
-- This was causing the "Cargando..." issue on ChatPage

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Users can view own characters" ON public.characters;

-- Create a new policy that allows:
-- 1. Anyone to read public characters (needed for chat page & discovery)
-- 2. Creators to also see their own non-public characters
CREATE POLICY "Anyone can read public characters or own characters"
ON public.characters
FOR SELECT
USING (
  is_public = true 
  OR creator_id = auth.uid()
);

UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/apng',
  'video/mp4', 'video/webm', 'video/quicktime'
]
WHERE id = 'character-images';

-- Tabla de cÃ³digos promocionales
CREATE TABLE public.promo_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  tts_responses integer NOT NULL DEFAULT 15,
  voice_call_minutes integer NOT NULL DEFAULT 15,
  expires_at timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabla de canjes de cÃ³digo por usuario
CREATE TABLE public.user_promo_redemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  promo_code_id uuid NOT NULL REFERENCES public.promo_codes(id),
  tts_responses_remaining integer NOT NULL DEFAULT 15,
  voice_call_seconds_remaining integer NOT NULL DEFAULT 900,
  redeemed_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  UNIQUE(user_id, promo_code_id)
);

-- RLS para promo_codes (solo lectura pÃºblica para validar cÃ³digos)
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active promo codes" ON public.promo_codes
  FOR SELECT USING (is_active = true);

-- RLS para user_promo_redemptions
ALTER TABLE public.user_promo_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own redemptions" ON public.user_promo_redemptions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own redemptions" ON public.user_promo_redemptions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own redemptions" ON public.user_promo_redemptions
  FOR UPDATE USING (user_id = auth.uid());
UPDATE characters SET voice = 'es-US-Chirp3-HD-Leda' WHERE voice != 'es-US-Chirp3-HD-Leda';

-- Rate limiting table
CREATE TABLE public.rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_rate_limit_user_func_time ON public.rate_limit_log (user_id, function_name, created_at DESC);

-- Enable RLS (only service role should access this)
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- No public policies - only accessible via service role or SECURITY DEFINER function

-- Auto-cleanup: delete entries older than 1 hour
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id uuid,
  _function_name text,
  _max_requests int,
  _window_seconds int DEFAULT 3600
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count int;
BEGIN
  -- Clean old entries for this user/function
  DELETE FROM public.rate_limit_log
  WHERE user_id = _user_id
    AND function_name = _function_name
    AND created_at < now() - make_interval(secs => _window_seconds);

  -- Count recent requests
  SELECT count(*) INTO _count
  FROM public.rate_limit_log
  WHERE user_id = _user_id
    AND function_name = _function_name
    AND created_at >= now() - make_interval(secs => _window_seconds);

  -- If under limit, log and allow
  IF _count < _max_requests THEN
    INSERT INTO public.rate_limit_log (user_id, function_name) VALUES (_user_id, _function_name);
    RETURN true;
  END IF;

  RETURN false;
END;
$$;
DROP POLICY IF EXISTS "Anyone can read active promo codes" ON public.promo_codes;
DELETE FROM public.characters WHERE id = '0c58fee3-8f2f-47f6-916b-0cfae90624c3';

-- 1) Privilege escalation fix: remove self-insert on user_promo_redemptions.
-- Inserts will only happen via the validate-promo-code edge function using the service role (bypasses RLS).
DROP POLICY IF EXISTS "Users can insert own redemptions" ON public.user_promo_redemptions;
DROP POLICY IF EXISTS "Users can update own redemptions" ON public.user_promo_redemptions;

-- 2) Add explicit admin-only management policies on promo_codes so the table is not RLS-enabled with zero policies.
CREATE POLICY "Admins can view promo codes"
ON public.promo_codes FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert promo codes"
ON public.promo_codes FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update promo codes"
ON public.promo_codes FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete promo codes"
ON public.promo_codes FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

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

ALTER VIEW public.characters_public SET (security_invoker = on);
GRANT SELECT ON public.characters_public TO anon, authenticated;
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
