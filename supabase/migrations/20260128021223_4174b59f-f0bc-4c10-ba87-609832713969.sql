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
INSERT INTO storage.buckets (id, name, public) VALUES ('character-images', 'character-images', true);

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