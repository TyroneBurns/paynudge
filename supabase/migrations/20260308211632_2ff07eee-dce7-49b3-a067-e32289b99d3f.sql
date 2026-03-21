CREATE OR REPLACE FUNCTION public.notify_admin_new_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  anon_key text;
  supabase_url text;
BEGIN
  BEGIN
    SELECT s.decrypted_secret INTO anon_key
    FROM vault.decrypted_secrets s WHERE s.name = 'SUPABASE_ANON_KEY' LIMIT 1;

    SELECT s.decrypted_secret INTO supabase_url
    FROM vault.decrypted_secrets s WHERE s.name = 'SUPABASE_URL' LIMIT 1;

    IF anon_key IS NOT NULL AND supabase_url IS NOT NULL THEN
      PERFORM net.http_post(
        url := supabase_url || '/functions/v1/admin-notify',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || anon_key
        ),
        body := jsonb_build_object(
          'type', 'new_signup',
          'email', NEW.email,
          'full_name', COALESCE(NEW.full_name, '')
        )
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Don't block signup if notification fails
    RAISE WARNING 'notify_admin_new_signup failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;