
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
