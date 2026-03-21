-- Create xero_oauth_states table for CSRF protection
CREATE TABLE public.xero_oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  state_token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_xero_oauth_states_created ON public.xero_oauth_states(created_at);

ALTER TABLE public.xero_oauth_states ENABLE ROW LEVEL SECURITY;

-- Add unique constraint on reminders to prevent duplicates
ALTER TABLE public.reminders ADD CONSTRAINT reminders_invoice_reminder_unique UNIQUE (invoice_id, reminder_number);