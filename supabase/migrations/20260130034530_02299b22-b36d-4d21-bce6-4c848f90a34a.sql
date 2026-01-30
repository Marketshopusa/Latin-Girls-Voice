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

-- Políticas RLS
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