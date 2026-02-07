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