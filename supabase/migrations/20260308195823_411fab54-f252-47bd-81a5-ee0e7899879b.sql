CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  path text NOT NULL,
  referrer text,
  source text DEFAULT 'direct',
  country text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view page_views"
  ON public.page_views FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert page_views"
  ON public.page_views FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_page_views_created_at ON public.page_views (created_at);
CREATE INDEX idx_page_views_source ON public.page_views (source);
CREATE INDEX idx_page_views_visitor_id ON public.page_views (visitor_id);