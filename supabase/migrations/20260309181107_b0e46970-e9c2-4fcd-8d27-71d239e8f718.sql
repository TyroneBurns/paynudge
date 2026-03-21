
-- Store the anon key in vault so cron jobs can use it
SELECT vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11d3Bwd2lpZWFycm5ybG92Y3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTIyNjEsImV4cCI6MjA4ODM4ODI2MX0.XrZYzz6LQt5uA3BQrfN2o96LRKrwudErhjohk1WZd3U',
  'SUPABASE_ANON_KEY'
);

-- Update invoke_edge_function to use anon key from vault
CREATE OR REPLACE FUNCTION public.invoke_edge_function(function_name text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  anon_key text;
  result bigint;
BEGIN
  SELECT s.decrypted_secret INTO anon_key
  FROM vault.decrypted_secrets s
  WHERE s.name = 'SUPABASE_ANON_KEY'
  LIMIT 1;

  SELECT net.http_post(
    url := 'https://muwppwiiearrnrlovcwu.supabase.co/functions/v1/' || function_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := '{"scheduled": true}'::jsonb
  ) INTO result;

  RETURN result;
END;
$function$;

-- Remove old cron jobs
SELECT cron.unschedule('campaign-send-9am');
SELECT cron.unschedule('campaign-send-11am');
SELECT cron.unschedule('campaign-send-1pm');
SELECT cron.unschedule('campaign-send-3pm');

-- Recreate cron jobs using anon key from vault
SELECT cron.schedule('campaign-send-9am', '0 9 * * *', $$
  SELECT net.http_post(
    url := 'https://muwppwiiearrnrlovcwu.supabase.co/functions/v1/campaign-sender',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_ANON_KEY' LIMIT 1)
    ),
    body := '{"scheduled": true}'::jsonb
  ) AS request_id;
$$);

SELECT cron.schedule('campaign-send-11am', '0 11 * * *', $$
  SELECT net.http_post(
    url := 'https://muwppwiiearrnrlovcwu.supabase.co/functions/v1/campaign-sender',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_ANON_KEY' LIMIT 1)
    ),
    body := '{"scheduled": true}'::jsonb
  ) AS request_id;
$$);

SELECT cron.schedule('campaign-send-1pm', '0 13 * * *', $$
  SELECT net.http_post(
    url := 'https://muwppwiiearrnrlovcwu.supabase.co/functions/v1/campaign-sender',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_ANON_KEY' LIMIT 1)
    ),
    body := '{"scheduled": true}'::jsonb
  ) AS request_id;
$$);

SELECT cron.schedule('campaign-send-3pm', '0 15 * * *', $$
  SELECT net.http_post(
    url := 'https://muwppwiiearrnrlovcwu.supabase.co/functions/v1/campaign-sender',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_ANON_KEY' LIMIT 1)
    ),
    body := '{"scheduled": true}'::jsonb
  ) AS request_id;
$$);
