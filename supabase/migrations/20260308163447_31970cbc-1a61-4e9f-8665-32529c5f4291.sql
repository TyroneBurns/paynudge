ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS country_code text;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS default_phone_prefix text;