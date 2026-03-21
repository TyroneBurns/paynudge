ALTER TABLE public.campaigns 
  ADD COLUMN IF NOT EXISTS last_batch_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS contacts_processed integer NOT NULL DEFAULT 0;