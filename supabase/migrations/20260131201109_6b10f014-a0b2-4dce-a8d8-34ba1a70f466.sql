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

-- Políticas RLS para user_usage
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