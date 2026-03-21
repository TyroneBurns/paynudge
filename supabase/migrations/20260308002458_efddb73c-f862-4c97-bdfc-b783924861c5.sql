
-- Add Gmail OAuth columns to organisations
ALTER TABLE public.organisations 
  ADD COLUMN IF NOT EXISTS gmail_access_token TEXT,
  ADD COLUMN IF NOT EXISTS gmail_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS gmail_token_expiry TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS gmail_email TEXT;

-- Create gmail_oauth_states table (same pattern as xero_oauth_states)
CREATE TABLE IF NOT EXISTS public.gmail_oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  state_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gmail_oauth_states ENABLE ROW LEVEL SECURITY;
