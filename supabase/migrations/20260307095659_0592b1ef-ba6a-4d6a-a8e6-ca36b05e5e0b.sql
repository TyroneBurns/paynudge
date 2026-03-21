
-- Add timezone and currency to organisations
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC';
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS default_currency text NOT NULL DEFAULT 'GBP';

-- Create notification_preferences table
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  reminder_sent boolean NOT NULL DEFAULT true,
  reminder_failed boolean NOT NULL DEFAULT true,
  email_opened boolean NOT NULL DEFAULT true,
  invoice_paid boolean NOT NULL DEFAULT true,
  new_invoice_synced boolean NOT NULL DEFAULT true,
  integration_issues boolean NOT NULL DEFAULT true,
  plan_limits boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification prefs" ON public.notification_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notification prefs" ON public.notification_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notification prefs" ON public.notification_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Add logo_url to organisations
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS logo_url text;
