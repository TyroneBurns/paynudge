ALTER TABLE public.notification_preferences 
  ADD COLUMN IF NOT EXISTS client_no_contact_info boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reminder_digest boolean NOT NULL DEFAULT true;