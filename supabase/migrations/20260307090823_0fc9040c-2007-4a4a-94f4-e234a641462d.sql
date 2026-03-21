
-- Enum types
CREATE TYPE public.reminder_method AS ENUM ('sms', 'email');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'overdue', 'paid', 'voided');
CREATE TYPE public.subscription_status AS ENUM ('free', 'active', 'past_due', 'cancelled');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  stripe_customer_id TEXT,
  subscription_status public.subscription_status NOT NULL DEFAULT 'free',
  subscription_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Organisations table
CREATE TABLE public.organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  xero_tenant_id TEXT,
  xero_access_token TEXT,
  xero_refresh_token TEXT,
  xero_token_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orgs" ON public.organisations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orgs" ON public.organisations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orgs" ON public.organisations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own orgs" ON public.organisations
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_organisations_updated_at
  BEFORE UPDATE ON public.organisations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  reminders_paused BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients" ON public.clients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.organisations o WHERE o.id = organisation_id AND o.user_id = auth.uid())
  );
CREATE POLICY "Users can insert own clients" ON public.clients
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.organisations o WHERE o.id = organisation_id AND o.user_id = auth.uid())
  );
CREATE POLICY "Users can update own clients" ON public.clients
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.organisations o WHERE o.id = organisation_id AND o.user_id = auth.uid())
  );
CREATE POLICY "Users can delete own clients" ON public.clients
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.organisations o WHERE o.id = organisation_id AND o.user_id = auth.uid())
  );

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  xero_invoice_id TEXT,
  invoice_number TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP',
  issue_date DATE,
  due_date DATE,
  status public.invoice_status NOT NULL DEFAULT 'sent',
  payment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices" ON public.invoices
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.organisations o WHERE o.id = organisation_id AND o.user_id = auth.uid())
  );
CREATE POLICY "Users can insert own invoices" ON public.invoices
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.organisations o WHERE o.id = organisation_id AND o.user_id = auth.uid())
  );
CREATE POLICY "Users can update own invoices" ON public.invoices
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.organisations o WHERE o.id = organisation_id AND o.user_id = auth.uid())
  );

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reminders table
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  reminder_number INT NOT NULL DEFAULT 1,
  method public.reminder_method NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders" ON public.reminders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      JOIN public.organisations o ON o.id = i.organisation_id
      WHERE i.id = invoice_id AND o.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own reminders" ON public.reminders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices i
      JOIN public.organisations o ON o.id = i.organisation_id
      WHERE i.id = invoice_id AND o.user_id = auth.uid()
    )
  );

-- Reminder rules table
CREATE TABLE public.reminder_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  days_after_due INT NOT NULL,
  method public.reminder_method NOT NULL DEFAULT 'email',
  message_template TEXT NOT NULL DEFAULT 'Hi {client_name}, just a quick reminder that invoice {invoice_number} for {amount} is overdue. You can pay here: {payment_url}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reminder_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rules" ON public.reminder_rules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.organisations o WHERE o.id = organisation_id AND o.user_id = auth.uid())
  );
CREATE POLICY "Users can insert own rules" ON public.reminder_rules
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.organisations o WHERE o.id = organisation_id AND o.user_id = auth.uid())
  );
CREATE POLICY "Users can update own rules" ON public.reminder_rules
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.organisations o WHERE o.id = organisation_id AND o.user_id = auth.uid())
  );
CREATE POLICY "Users can delete own rules" ON public.reminder_rules
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.organisations o WHERE o.id = organisation_id AND o.user_id = auth.uid())
  );

CREATE TRIGGER update_reminder_rules_updated_at
  BEFORE UPDATE ON public.reminder_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit log table
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  detail TEXT,
  level TEXT NOT NULL DEFAULT 'info',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON public.audit_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all audit logs" ON public.audit_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_invoices_org ON public.invoices(organisation_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX idx_reminders_invoice ON public.reminders(invoice_id);
CREATE INDEX idx_clients_org ON public.clients(organisation_id);
CREATE INDEX idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_org ON public.audit_log(organisation_id);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_log;
