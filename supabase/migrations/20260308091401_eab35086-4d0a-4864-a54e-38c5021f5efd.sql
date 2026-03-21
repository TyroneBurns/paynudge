
-- Campaign tables
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  body_text text NOT NULL DEFAULT '',
  attachment_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  total_contacts integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  open_count integer NOT NULL DEFAULT 0,
  click_count integer NOT NULL DEFAULT 0,
  bounce_count integer NOT NULL DEFAULT 0,
  unsub_count integer NOT NULL DEFAULT 0
);

CREATE TABLE public.campaign_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  last_name text,
  company_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'clicked', 'bounced', 'unsubscribed', 'converted')),
  sent_at timestamp with time zone,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  unsubscribed_at timestamp with time zone NOT NULL DEFAULT now(),
  campaign_id uuid REFERENCES public.campaigns(id)
);

CREATE UNIQUE INDEX unsubscribes_email_idx ON public.unsubscribes(email);

-- RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaigns" ON public.campaigns FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage campaign contacts" ON public.campaign_contacts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage unsubscribes" ON public.unsubscribes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for campaign attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('campaign-attachments', 'campaign-attachments', true);

CREATE POLICY "Admins can upload campaign attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'campaign-attachments' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can read campaign attachments" ON storage.objects FOR SELECT USING (bucket_id = 'campaign-attachments');
CREATE POLICY "Admins can delete campaign attachments" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'campaign-attachments' AND public.has_role(auth.uid(), 'admin'));
