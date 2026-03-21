import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, useNavigate } from "react-router-dom";
import { Check, ChevronRight, BellRing, Globe, Building2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import xeroLogo from "@/assets/xero-logo.png";
import gmailLogo from "@/assets/gmail-logo.png";

const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸", currency: "USD", symbol: "$", phone: "+1" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", currency: "GBP", symbol: "£", phone: "+44" },
  { code: "AU", name: "Australia", flag: "🇦🇺", currency: "AUD", symbol: "A$", phone: "+61" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", currency: "NZD", symbol: "NZ$", phone: "+64" },
  { code: "CA", name: "Canada", flag: "🇨🇦", currency: "CAD", symbol: "CA$", phone: "+1" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", currency: "EUR", symbol: "€", phone: "+353" },
  { code: "DE", name: "Germany", flag: "🇩🇪", currency: "EUR", symbol: "€", phone: "+49" },
  { code: "FR", name: "France", flag: "🇫🇷", currency: "EUR", symbol: "€", phone: "+33" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", currency: "EUR", symbol: "€", phone: "+31" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", currency: "SGD", symbol: "S$", phone: "+65" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", currency: "ZAR", symbol: "R", phone: "+27" },
];

const TZ_TO_COUNTRY: Record<string, string> = {
  "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US", "America/Los_Angeles": "US",
  "America/Phoenix": "US", "America/Anchorage": "US", "Pacific/Honolulu": "US",
  "Europe/London": "GB",
  "Australia/Sydney": "AU", "Australia/Melbourne": "AU", "Australia/Brisbane": "AU", "Australia/Perth": "AU",
  "Pacific/Auckland": "NZ",
  "America/Toronto": "CA", "America/Vancouver": "CA", "America/Edmonton": "CA", "America/Winnipeg": "CA",
  "Europe/Dublin": "IE",
  "Europe/Berlin": "DE",
  "Europe/Paris": "FR",
  "Europe/Amsterdam": "NL",
  "Asia/Singapore": "SG",
  "Africa/Johannesburg": "ZA",
};

interface StepProps {
  number: number;
  title: string;
  description: string;
  connected: boolean;
  children: React.ReactNode;
}

const Step = ({ number, title, description, connected, children }: StepProps) => (
  <div className={`border rounded-lg p-6 transition-colors ${connected ? "border-primary/40 bg-primary/[0.03]" : "border-border"}`}>
    <div className="flex items-start gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${connected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
        {connected ? <Check className="w-5 h-5" /> : <span className="font-bold text-sm">{number}</span>}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-display text-lg font-bold">{title}</h3>
          {connected && <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">Done</span>}
        </div>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        {children}
      </div>
    </div>
  </div>
);

const OnboardingPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [xeroConnected, setXeroConnected] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [flowConfigured, setFlowConfigured] = useState(false);
  const [connectingXero, setConnectingXero] = useState(false);
  const [connectingGmail, setConnectingGmail] = useState(false);

  // Country step
  const [countryDone, setCountryDone] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<typeof COUNTRIES[number] | null>(null);
  const [savingCountry, setSavingCountry] = useState(false);

  // Company profile step
  const [profileDone, setProfileDone] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    // Auto-detect country from timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const detected = TZ_TO_COUNTRY[tz];
    if (detected) {
      const c = COUNTRIES.find((c) => c.code === detected);
      if (c) setSelectedCountry(c);
    }

    (async () => {
      const { data: org } = await supabase.from("organisations").select("xero_tenant_id, gmail_access_token, id, country_code, default_currency, company_name, logo_url").eq("user_id", user.id).maybeSingle();
      if (org?.xero_tenant_id) setXeroConnected(true);
      if (org?.gmail_access_token) setGmailConnected(true);
      if ((org as any)?.country_code) {
        setCountryDone(true);
        const c = COUNTRIES.find((c) => c.code === (org as any).country_code);
        if (c) setSelectedCountry(c);
      }
      // Check company profile step
      if (org?.company_name && org.company_name.trim().length > 0) {
        setProfileDone(true);
        setCompanyName(org.company_name);
        if (org.logo_url) setLogoPreview(org.logo_url);
      }

      if (org) {
        const { data: rules } = await supabase.from("reminder_rules").select("id").eq("organisation_id", org.id).limit(1);
        if (rules && rules.length > 0) setFlowConfigured(true);
      }
    })();
  }, [user]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading…</p></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const handleCountryContinue = async () => {
    if (!selectedCountry || !user) return;
    setSavingCountry(true);
    try {
      // Check if org already exists
      const { data: existingOrg } = await supabase.from("organisations").select("id").eq("user_id", user.id).maybeSingle();
      let org;
      if (existingOrg) {
        const { data: updated } = await supabase.from("organisations").update({
          default_currency: selectedCountry.currency,
          country_code: selectedCountry.code,
          default_phone_prefix: selectedCountry.phone,
        }).eq("user_id", user.id).select("id").single();
        org = updated;
      } else {
        const { data: created } = await supabase.from("organisations").insert({
          user_id: user.id,
          default_currency: selectedCountry.currency,
          country_code: selectedCountry.code,
          default_phone_prefix: selectedCountry.phone,
          company_name: "My Company",
        }).select("id").single();
        org = created;
      }

      // Seed default reminder rules if none exist
      if (org) {
        const { data: existingRules } = await supabase.from("reminder_rules").select("id").eq("organisation_id", org.id).limit(1);
        if (!existingRules || existingRules.length === 0) {
          await supabase.from("reminder_rules").insert([
            { organisation_id: org.id, days_after_due: 0, method: "email", subject_line: "Invoice {invoice_number} is due today", message_template: "Hi {client_name}, just a friendly reminder that invoice {invoice_number} for {amount} is due today. If you've already arranged payment please ignore this message. Pay online: {payment_url}", is_active: true },
            { organisation_id: org.id, days_after_due: 3, method: "email", subject_line: "Invoice {invoice_number} — payment overdue", message_template: "Hi {client_name}, invoice {invoice_number} for {amount} was due on {due_date} and we haven't received payment yet. If there's an issue please reply to this email. Pay online: {payment_url}", is_active: true },
            { organisation_id: org.id, days_after_due: 7, method: "email", subject_line: "Reminder: Invoice {invoice_number} now 7 days overdue", message_template: "Hi {client_name}, invoice {invoice_number} for {amount} due on {due_date} is now 7 days overdue. Please arrange payment as soon as possible. Pay here: {payment_url}", is_active: true },
            { organisation_id: org.id, days_after_due: 14, method: "email", subject_line: "Final notice: Invoice {invoice_number}", message_template: "Hi {client_name}, invoice {invoice_number} for {amount} is now 14 days overdue. This is a final notice before we consider further action. If you have already paid please send remittance to support@paynudge.co. Pay immediately: {payment_url}", is_active: true },
          ] as any);
        }
      }

      setCountryDone(true);
      toast.success(`Set to ${selectedCountry.name} (${selectedCountry.currency})`);
    } catch {
      toast.error("Failed to save country");
    }
    setSavingCountry(false);
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Only PNG, JPEG, or WebP files allowed");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProfileContinue = async (skipLogo = false) => {
    if (!companyName.trim() || !user) return;
    setSavingProfile(true);
    try {
      let logoUrl: string | null = null;

      // Upload logo if provided
      if (!skipLogo && logoFile) {
        const ext = logoFile.name.split(".").pop()?.toLowerCase() || "png";
        const path = `${user.id}/logo.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("logos")
          .upload(path, logoFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage.from("logos").getPublicUrl(path);
        logoUrl = publicUrl.publicUrl;
      }

      const updateData: Record<string, any> = { company_name: companyName.trim() };
      if (logoUrl) updateData.logo_url = logoUrl;

      await supabase.from("organisations")
        .update(updateData)
        .eq("user_id", user.id);

      setProfileDone(true);
      toast.success("Company profile saved");
    } catch {
      toast.error("Failed to save company profile");
    }
    setSavingProfile(false);
  };

  const connectXero = async () => {
    setConnectingXero(true);
    try {
      const { data, error } = await supabase.functions.invoke("xero-auth");
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      toast.error("Failed to start Xero connection");
    }
    setConnectingXero(false);
  };

  const connectGmail = async () => {
    setConnectingGmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("gmail-auth");
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      toast.error("Failed to start Gmail connection");
    }
    setConnectingGmail(false);
  };

  const allDone = countryDone && profileDone && xeroConnected && flowConfigured;

  return (
    <div className="max-w-[700px]">
      <h1 className="font-display text-3xl font-bold mb-2">Onboarding</h1>
      <p className="text-muted-foreground mb-8">Complete these steps to start chasing invoices automatically.</p>

      <div className="space-y-6">
        {/* Step 1: Country */}
        <Step number={1} title="Where is your business based?" description="We'll set your default currency and phone format automatically." connected={countryDone}>
          {!countryDone ? (
            <div>
              <select
                value={selectedCountry?.code || ""}
                onChange={(e) => {
                  const c = COUNTRIES.find((c) => c.code === e.target.value);
                  if (c) setSelectedCountry(c);
                }}
                className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm appearance-none"
              >
                <option value="" disabled>Select your country…</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag}  {c.name} — {c.currency}
                  </option>
                ))}
              </select>
              {selectedCountry && (
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedCountry.flag} {selectedCountry.name} · Currency: <span className="font-mono">{selectedCountry.currency}</span> · Phone: <span className="font-mono">{selectedCountry.phone}</span>
                </p>
              )}
              <button
                onClick={handleCountryContinue}
                disabled={!selectedCountry || savingCountry}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
              >
                <Globe className="w-4 h-4" />
                {savingCountry ? "Saving…" : "Continue"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Check className="w-4 h-4" /> {selectedCountry?.flag} {selectedCountry?.name} — {selectedCountry?.currency}
            </div>
          )}
        </Step>

        {/* Step 2: Company Profile */}
        <Step number={2} title="Your company" description="Add your company name and logo. Your logo will appear on reminder emails sent to clients." connected={profileDone}>
          {!profileDone ? (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Design Ltd"
                  className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Company Logo <span className="text-muted-foreground/60 normal-case">(optional)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
                {logoPreview ? (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg border border-border bg-secondary flex items-center justify-center overflow-hidden">
                      <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                    </div>
                    <button
                      onClick={handleRemoveLogo}
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-dashed border-border text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload logo (PNG, JPEG, max 2MB)
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => handleProfileContinue(false)}
                  disabled={!companyName.trim() || savingProfile}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Building2 className="w-4 h-4" />
                  {savingProfile ? "Saving…" : "Continue"}
                  <ChevronRight className="w-4 h-4" />
                </button>
                {!logoFile && (
                  <button
                    onClick={() => handleProfileContinue(true)}
                    disabled={!companyName.trim() || savingProfile}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    Add logo later →
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-primary">
              {logoPreview && (
                <img src={logoPreview} alt="Logo" className="w-8 h-8 rounded object-contain border border-border" />
              )}
              <Check className="w-4 h-4" /> {companyName}
            </div>
          )}
        </Step>

        {/* Step 3: Xero */}
        <Step number={3} title="Connect Xero" description="Sync your invoices and contacts from Xero. This is required to start sending reminders." connected={xeroConnected}>
          {!xeroConnected ? (
            <button onClick={connectXero} disabled={connectingXero} className="inline-flex items-center gap-3 px-6 py-3 rounded-md font-bold bg-foreground text-background hover:opacity-90 transition-opacity">
              <img src={xeroLogo} alt="Xero" className="w-5 h-5 object-contain" />
              {connectingXero ? "Connecting…" : "Connect Xero"}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Check className="w-4 h-4" /> Xero Connected
            </div>
          )}
        </Step>

        {/* Step 4: Gmail */}
        <Step number={4} title="Connect Gmail" description="Send reminders directly from your email address. Clients will see your name, not ours." connected={gmailConnected}>
          {!gmailConnected ? (
            <div className="relative inline-block">
              <button disabled className="inline-flex items-center gap-3 px-6 py-3 rounded-md font-bold bg-foreground/40 text-background/60 cursor-not-allowed">
                <img src={gmailLogo} alt="Gmail" className="w-5 h-5 object-contain opacity-50" />
                Connect Gmail
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="absolute -top-2.5 -right-3 bg-accent text-accent-foreground text-[10px] font-bold font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-lg rotate-3">
                Coming Soon
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Check className="w-4 h-4" /> Gmail Connected
            </div>
          )}
        </Step>

        {/* Step 5: Reminder Flow */}
        <Step number={5} title="Set up Reminder Flow" description="Configure your automated reminder sequence. Choose when and how reminders are sent to your clients." connected={flowConfigured}>
          {!flowConfigured ? (
            <button onClick={() => navigate("/reminder-flow")} className="inline-flex items-center gap-3 px-6 py-3 rounded-md font-bold bg-foreground text-background hover:opacity-90 transition-opacity">
              <BellRing className="w-4 h-4" />
              Configure Flow
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Check className="w-4 h-4" /> Flow Configured
            </div>
          )}
        </Step>
      </div>

      {allDone && (
        <div className="mt-10 text-center">
          <button onClick={() => navigate("/dashboard")} className="px-8 py-3.5 rounded-md font-bold bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,212,168,0.4)] hover:-translate-y-0.5 transition-all">
            Go to Dashboard →
          </button>
        </div>
      )}
    </div>
  );
};

export default OnboardingPage;
